import { callGroq } from "./groq"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  const { students } = req.body

  const messages = [
    {
      role: "system",
      content: `
Analyze student performance.

Return ONLY valid JSON:

{
  "alerts": [
    {
      "student_id": "",
      "student_name": "",
      "risk_level": "high",
      "reason": "",
      "recommendation": ""
    }
  ]
}
      `
    },
    {
      role: "user",
      content: JSON.stringify(
        students,
        null,
        2
      )
    }
  ]

  try {
  const response = await callGroq(messages, true)

  let parsed;

  try {
        parsed = JSON.parse(
        response.replace(/```json|```/g, '').trim()
        )
    } catch (e) {
        console.error("Bad AI JSON:", response)

        return res.status(200).json([])
    }

    const alerts = parsed?.alerts || []

    return res.status(200).json(alerts)

    } catch (err) {
    console.error(err)

    return res.status(500).json({
        error: "Alert generation failed"
    })
    }
}