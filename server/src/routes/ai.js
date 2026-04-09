import express    from 'express'
import axios      from 'axios'
import Anthropic  from '@anthropic-ai/sdk'
import { protect } from '../middleware/auth.js'
import Feedback   from '../models/Feedback.js'

const router     = express.Router()

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

// ── POST /api/ai/chat — streaming Claude response ─────────────────────────────
router.post('/chat', protect, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body
    const user = req.user

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required.' })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Build rich system prompt with user's actual data
    const systemPrompt = `You are an expert AI Career Assistant embedded in JobMatch AI, a job matching platform.

USER PROFILE:
- Name: ${user.name}
- Skills: ${user.skills?.length ? user.skills.join(', ') : 'None added yet'}
- Years of experience: ${user.yearsExp || 'Unknown'}
- CV uploaded: ${user.cvParsed ? 'Yes' : 'No'}
- Location: ${user.location || 'Not specified'}

YOUR ROLE:
You help users with career decisions, job searching, skill development, and salary negotiation. You have access to the user's profile data above and should personalise every response.

GUIDELINES:
- Be concise, specific, and actionable — no waffle
- Reference the user's actual skills when giving advice
- Use markdown: **bold** for emphasis, bullet lists for steps, tables for comparisons
- When the user has no skills yet, encourage them to upload their CV first
- Keep responses under 300 words unless asked for detail
- Always end with a specific follow-up question or action to keep the conversation useful`

    // Set headers for Server-Sent Events streaming
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173')
    res.flushHeaders()

    // Build message history for Claude
    const messages = [
      ...history.slice(-8).map(m => ({
        role:    m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: message.trim() },
    ]

    // Stream the response
    const stream = await client.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: 600,
      system:     systemPrompt,
      messages,
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        const text = chunk.delta.text
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()

  } catch (err) {
    // If headers already sent (streaming started), just end
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted.' })}\n\n`)
      return res.end()
    }

    if (err.status === 401) {
      return res.status(401).json({ message: 'Invalid Anthropic API key. Check ANTHROPIC_API_KEY in .env' })
    }
    next(err)
  }
})

// ── POST /api/ai/skill-gap ────────────────────────────────────────────────────
router.post('/skill-gap', protect, async (req, res, next) => {
  try {
    const { data } = await axios.post(`${AI_URL}/skill-gap`, {
      user_skills: req.user.skills || [],
      ...req.body,
    }, { timeout: 12000 })
    res.json(data)
  } catch (err) {
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ message: 'AI service unavailable.' })
    next(err)
  }
})

// ── POST /api/ai/parse-text ───────────────────────────────────────────────────
router.post('/parse-text', protect, async (req, res, next) => {
  try {
    const { data } = await axios.post(`${AI_URL}/parse-text`, req.body, { timeout: 10000 })
    res.json(data)
  } catch (err) {
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ message: 'AI service unavailable.' })
    next(err)
  }
})

// ── POST /api/ai/feedback ─────────────────────────────────────────────────────
router.post('/feedback', protect, async (req, res, next) => {
  try {
    const { type, rating, comment, referenceId } = req.body
    if (!type || !rating) return res.status(400).json({ message: 'type and rating required.' })
    await Feedback.create({ user: req.user._id, type, rating, comment, referenceId })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router