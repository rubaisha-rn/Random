import { useState } from 'react'

export default function AIChatbot({ profile, studentProfile }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hi ${profile?.name || 'there'}! I'm your atomcamp AI assistant 🤖 Ask me anything about Data Science or AI!`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return

    const userMsg = input
    setInput('')

    // add user message immediately
    setMessages(prev => [
      ...prev,
      { role: 'user', text: userMsg }
    ])

    setLoading(true)

    try {
      const context = studentProfile
        ? `Background: ${studentProfile.background}
Goal: ${studentProfile.goal}
Level: ${studentProfile.experience_level}`
        : 'New student'

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content:
                  'You are Atomcamp AI tutor. Explain clearly in 2–4 short sentences.'
              },
              {
                role: 'user',
                content: `${context}\n\nUser question: ${userMsg}`
              }
            ]
          })
        }
      )

      // handle HTTP errors
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText)
      }

      const data = await response.json()

      const reply =
        data?.choices?.[0]?.message?.content ||
        'Sorry, I could not generate a response.'

      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: reply
        }
      ])

    } catch (err) {
      console.error('AI Error:', err)

      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: 'AI is temporarily unavailable. Please try again.'
        }
      ])
    } finally {
      setLoading(false)
    }
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
              <div key={i} className={`chat-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble ai thinking">
                Thinking...
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
            />

            <button onClick={sendMessage} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}