import { useState, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../../components/ui/Toast'

export default function useUserDetail() {
  const [userId, setUserId]   = useState(null)
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const open = useCallback(async (id) => {
    setUserId(id)
    setDetail(null)
    setLoading(true)
    try {
      const { data } = await axios.get(`/api/admin/users/${id}`)
      setDetail(data.user)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load user detail.', 'error')
      setUserId(null)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const close = () => { setUserId(null); setDetail(null) }

  return { userId, detail, loading, open, close, isOpen: Boolean(userId) }
}