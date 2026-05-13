import { callGroq } from "./groq"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  const { message, context } = req.body

  const messages = [
    {
      role: "system",
      content:
        "You are atomcamp's AI learning assistant. atomcamp teaches Data Science and AI in Pakistan. Answer in 2-4 sentences. Be practical, encouraging, and concise."
    },
    {
      role: "user",
      content: `
Student context:
${context || "New student"}

Question:
${message}
      `
    }
  ]

  try {
    const response = await callGroq(messages)

    res.status(200).json({
      response
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: "Chat failed"
    })
  }
}