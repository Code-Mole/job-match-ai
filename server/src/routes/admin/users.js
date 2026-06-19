import express from  'express'
import User    from  '../../models/User.js'
import Job     from  '../../models/Job.js'
// import Notification from  '../../models/Notification.js'

const router  =  express.Router();
// NOTE: protect + adminOnly are applied centrally in routes/admin/index.js.
// Every route below is admin-only by inheritance.

const ROLES = ['user', 'admin']

// ── GET /api/admin/users — paginated, searchable, filterable list ─────────
router.get('/', async (req, res, next) => {
  try {
    const {
      search, role, isActive,
      page = 1, limit = 20, sort = '-createdAt',
    } = req.query

    const filter = {}

    if (search) {
      const re = new RegExp(escapeRegex(search), 'i')
      filter.$or = [{ name: re }, { email: re }]
    }
    if (role && ROLES.includes(role)) filter.role = role
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await User.countDocuments(filter)

    const users = await User.find(filter)
      .select('name email role isActive skills cvParsed yearsExp location lastLogin createdAt')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean()

    res.json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.max(1, Math.ceil(total / Number(limit))),
      users,
    })
  } catch (err) { next(err) }
})

// ── GET /api/admin/users/:id — full profile detail ─────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('savedJobs', 'title company location')
      .populate('appliedJobs.job', 'title company location')
      .lean()

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    res.json({ success: true, user })
  } catch (err) { next(err) }
})

// ── PATCH /api/admin/users/:id/role — change role ───────────────────────────
router.patch('/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body

    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `role must be one of: ${ROLES.join(', ')}` })
    }

    // Self-protection: an admin cannot demote themselves, which could
    // otherwise lock the only admin account out of the admin dashboard.
    if (req.params.id === String(req.user._id) && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    ).select('-password')

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    res.json({ success: true, user, message: `${user.email} is now ${role === 'admin' ? 'an admin' : 'a regular user'}.` })
  } catch (err) { next(err) }
})

// ── PATCH /api/admin/users/:id/status — activate / deactivate ──────────────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be true or false.' })
    }

    // Self-protection: an admin cannot deactivate their own account,
    // which would immediately lock them out (protect middleware checks
    // isActive on every request).
    if (req.params.id === String(req.user._id) && isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true }
    ).select('-password')

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    res.json({
      success: true,
      user,
      message: `${user.email} has been ${isActive ? 'reactivated' : 'deactivated'}.`,
    })
  } catch (err) { next(err) }
})

// ── DELETE /api/admin/users/:id — permanent delete with cascade cleanup ───
router.delete('/:id', async (req, res, next) => {
  try {
    // Self-protection: an admin cannot delete their own account.
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' })
    }

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    // ── Cascade cleanup ────────────────────────────────────────────────────
    // 1. Remove any notifications belonging to this user.
    await Notification.deleteMany({ user: user._id })

    // 2. Jobs created/updated by this user (if they were ever an admin)
    //    are NOT deleted — they remain in the system but their
    //    createdBy/updatedBy references are cleared to avoid dangling
    //    references to a deleted user.
    await Job.updateMany(
      { $or: [{ createdBy: user._id }, { updatedBy: user._id }] },
      { $set: { createdBy: null, updatedBy: null } }
    )

    // 3. Finally remove the user document itself. savedJobs and
    //    appliedJobs are embedded/referenced arrays on the user document
    //    and are removed automatically with it — no separate cleanup
    //    needed since jobs don't store back-references to users.
    await User.findByIdAndDelete(req.params.id)

    res.json({ success: true, message: `${user.email} has been permanently deleted.` })
  } catch (err) { next(err) }
})

// ── Helper: escape regex special characters in user input ──────────────────
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default router