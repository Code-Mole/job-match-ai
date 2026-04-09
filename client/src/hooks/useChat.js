import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

export const SUGGESTED_PROMPTS = [
  { id: 'p1', text: 'What jobs match my skills?',       icon: '🔍' },
  { id: 'p2', text: 'What skills should I learn next?', icon: '📚' },
  { id: 'p3', text: 'Suggest a career path for me',     icon: '🗺️' },
  { id: 'p4', text: 'How do I negotiate my salary?',    icon: '💰' },
  { id: 'p5', text: 'Review my profile and give tips',  icon: '✏️' },
  { id: 'p6', text: 'Compare Frontend vs Full Stack',   icon: '⚖️' },
]

const WELCOME = (name, skills) => {
  const firstName = name?.split(' ')[0] || 'there'
  const hasSkills = skills?.length > 0
  return hasSkills
    ? `Hi ${firstName}! I can see you have skills in **${skills.slice(0,3).join(', ')}**${skills.length > 3 ? ` and ${skills.length - 3} more` : ''}.\n\nHow can I help you today? I can find matching jobs, analyse your skill gaps, or suggest your next career move.`
    : `Hi ${firstName}! I'm your AI Career Assistant.\n\nI notice you haven't uploaded your CV yet — that's the best way to get personalised job matches and skill gap analysis. Try uploading it from the **Dashboard**.\n\nIn the meantime, what would you like to know about your career?`
}

export function useChat() {
  const { user } = useAuth()

  const [messages, setMessages] = useState(() => [{
    id:        'welcome',
    role:      'assistant',
    content:   WELCOME(user?.name, user?.skills),
    timestamp: new Date(),
    streaming: false,
  }])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const abortRef                = useRef(null)

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || loading) return

    // Add user message immediately
    const userMsg = {
      id:        `u-${Date.now()}`,
      role:      'user',
      content:   text.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setError(null)

    // Add empty assistant message that will be filled by streaming
    const assistantId = `a-${Date.now()}`
    setMessages(prev => [...prev, {
      id:        assistantId,
      role:      'assistant',
      content:   '',
      timestamp: new Date(),
      streaming: true,
    }])

    // Abort previous request if any
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      const token = localStorage.getItem('token')
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/chat`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body:   JSON.stringify({ message: text.trim(), history }),
          signal: abortRef.current.signal,
        }
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || `Server error ${response.status}`)
      }

      // Read SSE stream
      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let   fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              fullText += parsed.text
              // Update the streaming message token-by-token
              setMessages(prev =>
                prev.map(m => m.id === assistantId
                  ? { ...m, content: fullText }
                  : m
                )
              )
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected end of JSON input') {
              console.warn('SSE parse error:', parseErr.message)
            }
          }
        }
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(m => m.id === assistantId
          ? { ...m, content: fullText || 'Sorry, I received an empty response. Please try again.', streaming: false }
          : m
        )
      )

    } catch (err) {
      if (err.name === 'AbortError') return

      const fallback = 'I encountered an error. Please check that the server is running and your API key is set, then try again.'
      setMessages(prev =>
        prev.map(m => m.id === assistantId
          ? { ...m, content: fallback, streaming: false, isError: true }
          : m
        )
      )
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([{
      id:        `welcome-${Date.now()}`,
      role:      'assistant',
      content:   WELCOME(user?.name, user?.skills),
      timestamp: new Date(),
      streaming: false,
    }])
    setError(null)
    setLoading(false)
  }, [user])

  return { messages, loading, error, sendMessage, clearChat }
}