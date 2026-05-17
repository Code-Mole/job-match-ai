import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

// Render markdown-lite: **bold**, bullet lists, tables
function renderContent(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold
    const parts = line.split(/\*\*(.*?)\*\*/g).map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : p
    )
    // Table row
    if (line.startsWith('|')) {
      return <span key={i} className="block font-mono text-xs my-0.5 text-slate-600 dark:text-slate-400">{parts}</span>
    }
    // Bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <span key={i} className="flex gap-1.5 my-0.5">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
          <span>{parts}</span>
        </span>
      )
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      return <span key={i} className="block my-0.5">{parts}</span>
    }
    return <span key={i} className="block">{parts || <br />}</span>
  })
}

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false)
  const isUser   = message.role === 'user'
  const isStream = message.streaming

  const copyText = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold
        ${isUser
          ? 'bg-blue-600 text-white'
          : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
        }
      `}>
        {isUser ? (message.content[0]?.toUpperCase() || 'U') : '✦'}
      </div>

      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          relative px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : `bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border rounded-tl-sm ${message.isError ? 'border-red-200 dark:border-red-700/50' : 'border-slate-200 dark:border-white/8'}`
          }
        `}>
          <div className="whitespace-pre-wrap">
            {renderContent(message.content)}
            {/* Blinking cursor while streaming */}
            {isStream && (
              <span className="inline-block w-0.5 h-4 bg-blue-600 dark:bg-blue-400 ml-0.5 animate-pulse align-middle" />
            )}
          </div>

          {/* Copy button for assistant messages */}
          {!isUser && !isStream && message.content && (
            <button
              onClick={copyText}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-blue-600 shadow-sm"
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 px-1">{timeStr}</span>
      </div>
    </div>
  )
}