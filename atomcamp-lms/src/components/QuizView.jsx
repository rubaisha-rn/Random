import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function QuizView({ module, onComplete, onClose }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)

  useEffect(() => {
    supabase
      .from('quiz_questions')
      .select('*')
      .eq('module_id', module.id)
      .then(({ data }) => setQuestions(data || []))
  }, [module.id])

  // Fallback questions if none in DB (for demo safety)
  const displayQuestions = questions.length > 0 ? questions : [
    {
      id: 'fallback-1',
      question: `What is the main purpose of ${module.title}?`,
      options: ['To process data', 'To visualize results', 'To train models', 'All of the above'],
      correct_answer: 'All of the above'
    },
    {
      id: 'fallback-2',
      question: 'Which Python library is most commonly used for data manipulation?',
      options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
      correct_answer: 'Pandas'
    }
  ]

  function handleSubmit() {
    let correct = 0
    displayQuestions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++
    })
    const finalScore = (correct / displayQuestions.length) * 100
    setScore(finalScore)
    setSubmitted(true)
  }

  return (
    <div className="quiz-overlay">
      <div className="quiz-modal">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h3>{module.title}</h3>
        
        {!submitted ? (
          <>
            {displayQuestions.map((q, i) => (
              <div key={q.id} className="question-block">
                <p className="question-text"><strong>Q{i+1}.</strong> {q.question}</p>
                <div className="options">
                  {(Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')).map(opt => (
                    <label key={opt} className={`option ${answers[q.id] === opt ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="submit-quiz-btn"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < displayQuestions.length}
            >
              Submit Quiz
            </button>
          </>
        ) : (
          <div className="quiz-result">
            <div className={`score-circle ${score >= 60 ? 'pass' : 'fail'}`}>
              {Math.round(score)}%
            </div>
            <h3>{score >= 60 ? '🎉 Passed!' : '📚 Keep Practicing'}</h3>
            <p>
              {score >= 60
                ? 'Great work! Your learning path will advance to the next module.'
                : 'Score below 60%. Your AI learning path has been updated — you\'ll revisit this topic before moving on.'}
            </p>
            <button onClick={() => onComplete(score)}>
              {score >= 60 ? 'Continue' : 'Update My Path'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}