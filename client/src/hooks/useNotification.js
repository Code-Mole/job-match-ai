import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'

const POLL_INTERVAL = 60000 // 60 seconds

export default function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]      = useState(0)
  const [loading, setLoading]              = useState(true)
  const { showToast } = useToast()
  const { user } = useAuth()
  const intervalRef = useRef(null)

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await axios.get('/api/notifications')
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      if (!silent) showToast(err.response?.data?.message || 'Failed to load notifications.', 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [showToast])

  // Initial fetch + polling — only runs when authenticated
  useEffect(() => {
    if (!user) return
    fetchNotifications()
    intervalRef.current = setInterval(() => fetchNotifications(true), POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [user, fetchNotifications])

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update notification.', 'error')
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update notifications.', 'error')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`)
      setNotifications(prev => {
        const target = prev.find(n => n._id === id)
        if (target && !target.read) setUnreadCount(c => Math.max(0, c - 1))
        return prev.filter(n => n._id !== id)
      })
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete notification.', 'error')
    }
  }

  return {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, deleteNotification,
    refetch: () => fetchNotifications(),
  }
}