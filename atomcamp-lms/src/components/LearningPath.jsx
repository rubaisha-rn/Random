import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import QuizView from './QuizView'

export default function LearningPath({ profile, studentProfile, onProgressUpdate }) {
  const [pathData, setPathData] = useState(null)
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeModule, setActiveModule] = useState(null)

  useEffect(() => {
    if (studentProfile) loadPath()
  }, [studentProfile])

  async function loadPath() {
    setLoading(true)

    try {
        const { data: existing } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', profile.id)
        .single()

        if (existing) {
        setPathData(existing)

        await loadModulesForPath(
            Array.isArray(existing.path_json)
            ? existing.path_json
            : []
        )
        } else {
        await generatePath()
        }

        await loadProgress()
    } finally {
        setLoading(false)
    }
    }

  async function generatePath() {
    setGenerating(true)
    
    // Fetch all modules
    const { data: allModules } = await supabase
      .from('modules')
      .select('*, courses(title, difficulty, target_background)')
    
    // Fetch existing progress
    const { data: progressData } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', profile.id)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer YOUR_GROQ_API_KEY`
    },
    body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
        {
            role: "system",
            content: "Return ONLY JSON learning path."
        },
        {
            role: "user",
            content: JSON.stringify({
            profile: studentProfile,
            modules: allModules,
            progress: progressData
            })
        }
        ],
        temperature: 0.3
    })
    })

    const aiResult = await response.json()
    
    // Save to Supabase
    const { data: saved } = await supabase
      .from('learning_paths')
      .upsert({
        user_id: profile.id,
        path_json: aiResult.recommended_path,
        reasoning: aiResult.reasoning,
        estimated_weeks: aiResult.estimated_weeks,
        focus_areas: aiResult.focus_areas
      })
      .select()
      .single()

    setPathData(aiResult)
    await loadModulesForPath(aiResult.recommended_path)
    setGenerating(false)
  }

  async function loadModulesForPath(pathIds) {
    if (!pathIds?.length) return
    const { data } = await supabase
      .from('modules')
      .select('*, courses(title)')
      .in('id', pathIds)
    
    // Sort by the AI's recommended order
    const sorted = pathIds.map(id => data?.find(m => m.id === id)).filter(Boolean)
    setModules(sorted)
  }

  async function loadProgress() {
    const { data } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', profile.id)
    
    const progressMap = {}
    data?.forEach(p => { progressMap[p.module_id] = p })
    setProgress(progressMap)
  }

  async function markComplete(moduleId) {
    await supabase.from('progress').upsert({
      user_id: profile.id,
      module_id: moduleId,
      completed: true,
      time_spent_minutes: 15,
      attempts: 1
    })
    await loadProgress()
    onProgressUpdate?.()
  }

  async function handleQuizComplete(moduleId, score) {
    await supabase.from('progress').upsert({
      user_id: profile.id,
      module_id: moduleId,
      completed: score >= 60,
      score,
      attempts: (progress[moduleId]?.attempts || 0) + 1,
      completed_at: score >= 60 ? new Date().toISOString() : null
    })
    await loadProgress()
    onProgressUpdate?.()
    
    // RE-GENERATE PATH if quiz score was poor (the adaptive moment)
    if (score < 60) {
      await generatePath()
    }
    
    setActiveModule(null)
  }

  if (loading || generating) {
    return (
      <div className="path-loading">
        <div className="spinner" />
        <h3>{generating ? 'AI is building your personalized path...' : 'Loading your path...'}</h3>
        {generating && <p>Analyzing your background, goals, and quiz scores</p>}
      </div>
    )
  }

  if (!pathData) {
    return (
      <div className="path-empty">
        <p>Complete your profile to get a personalized learning path.</p>
        <button onClick={generatePath}>Generate My Path</button>
      </div>
    )
  }

  return (
    <div className="learning-path">
      {/* AI Reasoning Box — judges love this */}
      <div className="ai-reasoning-box">
        <span className="ai-badge">✨ AI Personalized</span>
        <p>{pathData.reasoning}</p>
        {pathData.focus_areas && (
          <div className="focus-tags">
            {(Array.isArray(pathData.focus_areas) ? pathData.focus_areas : []).map(area => (
              <span key={area} className="focus-tag">{area}</span>
            ))}
          </div>
        )}
        <p className="estimated">Estimated completion: ~{pathData.estimated_weeks} weeks</p>
      </div>

      {/* Module List */}
      <div className="modules-list">
        {modules.map((module, index) => {
          const prog = progress[module.id]
          const isCompleted = prog?.completed
          const isPriority = pathData.priority_modules?.includes(module.id)
          const needsReview = prog && !prog.completed && prog.attempts > 0

          return (
            <div key={module.id} className={`module-card ${isCompleted ? 'completed' : ''} ${needsReview ? 'needs-review' : ''}`}>
              <div className="module-number">{index + 1}</div>
              <div className="module-info">
                <div className="module-title-row">
                  <h4>{module.title}</h4>
                  {isPriority && <span className="priority-badge">⭐ Priority</span>}
                  {needsReview && <span className="review-badge">↩ Needs Review</span>}
                </div>
                <div className="module-meta">
                  <span className={`type-badge ${module.module_type}`}>{module.module_type}</span>
                  <span className="course-name">{module.courses?.title}</span>
                  {prog?.score != null && <span className="score">Score: {Math.round(prog.score)}%</span>}
                </div>
              </div>
              <div className="module-action">
                {isCompleted ? (
                  <span className="check">✓</span>
                ) : module.module_type === 'quiz' ? (
                  <button onClick={() => setActiveModule(module)}>Take Quiz</button>
                ) : (
                  <button onClick={() => markComplete(module.id)}>Mark Done</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quiz Modal */}
      {activeModule && (
        <QuizView
          module={activeModule}
          userId={profile.id}
          onComplete={(score) => handleQuizComplete(activeModule.id, score)}
          onClose={() => setActiveModule(null)}
        />
      )}
    </div>
  )
}