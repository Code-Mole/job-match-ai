import Notification from '../models/Notification.js';

/**
 * Fire-and-forget notification creator. Never throws — a failure to
 * notify should never break the calling request (e.g. an application
 * should still succeed even if notification creation fails).
 */
async function notify(userId, { type, title, message, link = null, meta = {} }) {
  try {
    await Notification.create({ user: userId, type, title, message, link, meta })
  } catch (err) {
    console.warn('Notification creation failed:', err.message)
  }
}

export  { notify }