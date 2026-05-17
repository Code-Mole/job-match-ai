import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export const SUGGESTED_PROMPTS = [
  { id: 'p1', text: 'What jobs match my skills?',       icon: '🔍' },
  { id: 'p2', text: 'What skills should I learn next?', icon: '📚' },
  { id: 'p3', text: 'Suggest a career path for me',     icon: '🗺️' },
  { id: 'p4', text: 'How do I negotiate my salary?',    icon: '💰' },
  { id: 'p5', text: 'Review my profile and give tips',  icon: '✏️' },
  { id: 'p6', text: 'Compare two career paths for me',  icon: '⚖️' },
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
  const messagesRef             = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || loading) return

    const userMsg = {
      id:        `u-${Date.now()}`,
      role:      'user',
      content:   text.trim(),
      timestamp: new Date(),
    }

    const assistantId = `a-${Date.now()}`

    const history = messagesRef.current
      .filter(
        (m) =>
          m.content?.trim() &&
          !m.streaming &&
          !m.isError &&
          (m.role === 'user' || m.role === 'assistant'),
      )
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg, {
      id:        assistantId,
      role:      'assistant',
      content:   '',
      timestamp: new Date(),
      streaming: true,
    }])
    setLoading(true)
    setError(null)

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      const token = localStorage.getItem('token')

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

      const reader  = response.body?.getReader()
      if (!reader) throw new Error('No response stream from server')

      const decoder = new TextDecoder()
      let fullText = ''
      let sseBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() ?? ''

        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line.startsWith('data:')) continue

          const payload = line.replace(/^data:\s*/, '').trim()
          if (payload === '[DONE]') continue

          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              fullText += parsed.text
              setMessages(prev =>
                prev.map(m => m.id === assistantId
                  ? { ...m, content: fullText }
                  : m
                )
              )
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr
            }
          }
        }
      }

      const finalContent = fullText.trim()
        || 'I could not generate a reply. Please verify your AI API key in server/.env (OPENAI_API_KEY, XAI_API_KEY, or ANTHROPIC_API_KEY) and try again.'

      setMessages(prev =>
        prev.map(m => m.id === assistantId
          ? { ...m, content: finalContent, streaming: false }
          : m
        )
      )

    } catch (err) {
      if (err.name === 'AbortError') return

      const msg = err.message || ''
      const fallback = msg.includes('API key') || msg.includes('credit') || msg.includes('CHAT_PROVIDER') || msg.includes('billing')
        ? msg
        : msg || 'I encountered an error. Please check that the server is running and set OPENAI_API_KEY or XAI_API_KEY with CHAT_PROVIDER in server/.env.'

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
  }, [loading])

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
