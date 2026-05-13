import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const QUESTIONS = [
  {
    key: 'background',
    question: 'What is your academic background?',
    options: ['Technical (STEM degree)', 'Non-technical (any other field)']
  },
  {
    key: 'goal',
    question: 'What is your primary career goal?',
    options: [
      'Get a Data Analyst job',
      'Get an AI/ML Engineer job',
      'Automate my current work',
      'Start freelancing with data skills',
      'General upskilling in AI'
    ]
  },
  {
    key: 'experience_level',
    question: 'How would you rate your Python experience?',
    options: ['None at all', 'Beginner (wrote some scripts)', 'Intermediate (built projects)', 'Advanced (professional)']
  },
  {
    key: 'preferred_pace',
    question: 'How much time can you dedicate per week?',
    options: ['5+ hours (fast pace)', '3 hours (normal pace)', '1-2 hours (slow pace)']
  },
  {
    key: 'learning_style',
    question: 'How do you learn best?',
    options: ['Watching videos', 'Hands-on projects', 'Reading and notes', 'Mix of everything']
  }
]

export default function Onboarding({ profile }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  function selectOption(key, value) {
    const updated = { ...answers, [key]: value }
    setAnswers(updated)
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(prev => prev + 1), 300)
    } else {
      submitOnboarding(updated)
    }
  }

  async function submitOnboarding(data) {

    try {
        setSaving(true)

        const {error: profileErr} = await supabase.from('student_profiles')
        .upsert({
            user_id: profile.id,
            background: data.background,
            goal: data.goal,
            experience_level: data.experience_level,
            preferred_pace: data.preferred_pace,
            learning_style: data.learning_style
        }, {
            onConflict: 'user_id'
        })

        if (profileErr) throw profileErr

        const {error: updateErr} = await supabase
            .from('profiles')
            .update({onboarded: true})
            .eq('id', profile.id)

        if (updateErr) throw updateErr

        await supabase.auth.refreshSession()

        window.location.href = '/dashboard'
    }
    catch (err) {
        console.log(err)
        alert('Onboarding failed. Please try again.')
    }
    finally {
        setSaving(false)
    }

  }

  const q = QUESTIONS[step]
  const progress = ((step) / QUESTIONS.length) * 100

  return (
    <div className="onboarding-page">
      <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>
      <p className="step-label">Step {step + 1} of {QUESTIONS.length}</p>
      
      {saving ? (
        <div className="ai-loading">
          <div className="spinner" />
          <h2>AI is generating your personalized learning path...</h2>
          <p>Analyzing your goals and experience to create the perfect curriculum</p>
        </div>
      ) : (
        <div className="question-card">
          <h2>{q.question}</h2>
          <div className="options-grid">
            {q.options.map(opt => (
              <button
                key={opt}
                className={`option-btn ${answers[q.key] === opt ? 'selected' : ''}`}
                onClick={() => selectOption(q.key, opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}