import { useState } from 'react'

export default function AIChatbot({ profile, studentProfile }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hi ${profile.name}! I'm your atomcamp AI assistant. Ask me anything about Data Science or AI! 🤖` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return
    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    const context = studentProfile
        ? `Student background: ${studentProfile.background}, Goal: ${studentProfile.goal}, Level: ${studentProfile.experience_level}`
        : 'New student'

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
    },
    body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
        {
            role: 'system',
            content: "You are atomcamp AI tutor. Answer in 2-4 sentences."
        },
        {
            role: 'user',
            content: `${context}\n\n${message}`
        }
        ]
    })
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content

    setMessages(prev => [
    ...prev,
    { role: 'ai', text: reply || "Sorry, no response" }
    ])
    setLoading(false)
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)}>
        {open ? '✕' : '🤖'}
      </button>
      
      {open && (
        <div className="chat-drawer">
          <div className="chat-header">AI Learning Assistant</div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="chat-bubble ai thinking">Thinking...</div>}
          </div>
          <div className="chat-input-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}