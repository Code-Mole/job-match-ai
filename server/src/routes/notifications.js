import express from 'express'
import { protect } from '../middleware/auth.js'
import Notification from '../models/Notification.js'


const router  = express.Router()
router.use(protect)

// ── GET /api/notifications ──────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(50)
      .lean()

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false })

    res.json({ success: true, notifications, unreadCount })
  } catch (err) { next(err) }
})

// ── PUT /api/notifications/:id/read ─────────────────────────────────────────
router.put('/:id/read', async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { read: true } },
      { new: true }
    )
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' })
    res.json({ success: true, notification: notif })
  } catch (err) { next(err) }
})

// ── PUT /api/notifications/read-all ─────────────────────────────────────────
router.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    )
    res.json({ success: true, message: 'All notifications marked as read.' })
  } catch (err) { next(err) }
})

// ── DELETE /api/notifications/:id ───────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' })
    res.json({ success: true, message: 'Notification deleted.' })
  } catch (err) { next(err) }
})

// ── POST /api/notifications/seed — dev/testing helper ──────────────────────
router.post('/seed', async (req, res, next) => {
  try {
    const samples = [
      { user: req.user._id, type: 'job_match',          title: 'New high match found',     message: 'A new job scored 91% against your profile.', link: '/jobs' },
      { user: req.user._id, type: 'application_update',  title: 'Application received',      message: 'Your application was successfully recorded.', link: '/jobs' },
      { user: req.user._id, type: 'skill_alert',         title: 'Skill gap identified',       message: 'You are missing 2 skills for your target role.', link: '/skills' },
      { user: req.user._id, type: 'system',               title: 'Welcome to JobMatch AI',     message: 'Upload your CV to get started with matching.', link: '/dashboard' },
    ]
    await Notification.insertMany(samples)
    res.json({ success: true, message: `${samples.length} sample notifications created.` })
  } catch (err) { next(err) }
})

export default router