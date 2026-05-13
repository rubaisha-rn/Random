export async function callGroq(messages, jsonMode = false) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages,
        temperature: 0.3,
        response_format: jsonMode
          ? { type: "json_object" }
          : undefined
      })
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err)
  }

  const data = await response.json()

  return data.choices[0].message.content
}