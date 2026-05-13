import { callGroq } from "./groq"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  const { profile, modules, progress } = req.body

  const messages = [
    {
      role: "system",
      content: `
You are an AI learning advisor for atomcamp.

Return ONLY valid JSON.

Required format:

{
  "recommended_path": [],
  "reasoning": "",
  "estimated_weeks": 8,
  "focus_areas": [],
  "priority_modules": [],
  "skip_modules": []
}
      `
    },
    {
      role: "user",
      content: `
Student Profile:
${JSON.stringify(profile, null, 2)}

Available Modules:
${JSON.stringify(modules, null, 2)}

Quiz Progress:
${JSON.stringify(progress, null, 2)}

Rules:
- Non-technical students start with basics
- Score below 60 = repeat before advancing
- Fast pace = more projects
- Visual learners = prioritize videos
      `
    }
  ]

  try {
    const response = await callGroq(
      messages,
      true
    )

    let parsed;

    try {
        parsed = JSON.parse(response.replace(/```json|```/g, '').trim())
    }catch(e) {

        return res.status(500).json({
            error:'Invalid AI JSON',
            raw: response
        })
    }

    if(!parsed.recommended_path){
        return res.status(200).json({
            recommended_path: [],
            reasoning: 'Default learning path applied due to AI fallback',
            estimated_weeks: 8,
            focus_areas: [],
            priority_modules: [],
            skip_modules: []
        })
    }

    res.status(200).json(parsed)
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: "AI path generation failed"
    })
  }
}