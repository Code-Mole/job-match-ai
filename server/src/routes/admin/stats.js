import express from  'express'
import Job     from  '../../models/Job.js'
import User    from  '../../models/User.js'

const router  =  express.Router();
// NOTE: protect + adminOnly are applied centrally in routes/admin/index.js.

// ── GET /api/admin/stats — dashboard overview aggregates ──────────────────
router.get('/', async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // All aggregations run in parallel — independent reads, no reason
    // to serialise them and add latency to the overview page load.
    const [
      totalJobs,
      activeJobs,
      jobsBySource,
      jobsByCountry,
      jobsByIndustryTop,
      newJobsLast7Days,
      totalUsers,
      usersByRole,
      activeUsersCount,
      inactiveUsersCount,
      newUsersLast7Days,
      recentJobs,
      recentUsers,
    ] = await Promise.all([
      Job.countDocuments({}),
      Job.countDocuments({ isActive: true }),

      Job.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Country breakdown — empty string grouped under "Unspecified" so
      // legacy Adzuna/Remotive jobs (which predate the country field)
      // don't silently disappear from the chart.
      Job.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: { $cond: [{ $eq: ['$country', ''] }, 'Unspecified', '$country'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      Job.aggregate([
        { $match: { isActive: true, industry: { $ne: '' } } },
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      Job.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      User.countDocuments({}),

      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Recent activity feed — most recently created/updated jobs
      Job.find({})
        .sort('-updatedAt')
        .limit(8)
        .select('title company country source updatedAt createdBy updatedBy')
        .populate('updatedBy', 'name email')
        .lean(),

      // Recent activity feed — most recently registered users
      User.find({})
        .sort('-createdAt')
        .limit(8)
        .select('name email role createdAt')
        .lean(),
    ])

    // Normalise the aggregate arrays into plain objects keyed by their
    // _id, which is much easier for the frontend to consume than an
    // array of { _id, count } pairs.
    const toMap = (arr) =>
      arr.reduce((acc, { _id, count }) => {
        acc[_id || 'unspecified'] = count
        return acc
      }, {})

    // Ghana-specific call-out — since this dashboard exists primarily
    // to solve the Ghana coverage gap, surface it explicitly rather
    // than making the admin dig through the country breakdown.
    const ghanaJobs = jobsByCountry.find(c => c._id === 'Ghana')?.count || 0

    // Build a unified, time-sorted activity feed combining both job
    // and user events rather than returning two separate lists for
    // the frontend to merge and sort itself.
    const activity = [
      ...recentJobs.map(j => ({
        type:      'job',
        action:    j.createdAt?.getTime?.() === j.updatedAt?.getTime?.() ? 'created' : 'updated',
        label:     `${j.title} — ${j.company}`,
        country:   j.country || null,
        source:    j.source,
        by:        j.updatedBy ? j.updatedBy.name : null,
        timestamp: j.updatedAt,
      })),
      ...recentUsers.map(u => ({
        type:      'user',
        action:    'registered',
        label:     `${u.name} (${u.email})`,
        role:      u.role,
        timestamp: u.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)

    res.json({
      success: true,
      jobs: {
        total:       totalJobs,
        active:      activeJobs,
        inactive:    totalJobs - activeJobs,
        newLast7Days: newJobsLast7Days,
        bySource:    toMap(jobsBySource),
        byCountry:   jobsByCountry.map(c => ({ country: c._id, count: c.count })),
        byIndustry:  jobsByIndustryTop.map(i => ({ industry: i._id, count: i.count })),
        ghanaCoverage: {
          count:      ghanaJobs,
          percentage: activeJobs > 0 ? Math.round((ghanaJobs / activeJobs) * 100) : 0,
        },
      },
      users: {
        total:        totalUsers,
        active:       activeUsersCount,
        inactive:     inactiveUsersCount,
        newLast7Days: newUsersLast7Days,
        byRole:       toMap(usersByRole),
      },
      activity,
    })
  } catch (err) { next(err) }
})
export default router