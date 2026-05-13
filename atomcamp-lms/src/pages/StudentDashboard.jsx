import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LearningPath from '../components/LearningPath'
import AIChatbot from '../components/AIChatbot'

export default function StudentDashboard({ profile }) {
  const [activeTab, setActiveTab] = useState('path')
  const [studentProfile, setStudentProfile] = useState(null)
  const [stats, setStats] = useState({ completed: 0, total: 0, avgScore: 0 })

  useEffect(() => {
    fetchStudentProfile()
    fetchStats()
  }, [])

  async function fetchStudentProfile() {
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .single()
    setStudentProfile(data)
  }

  async function fetchStats() {
    const { data } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', profile.id)
    
    if (data) {
      const completed = data.filter(p => p.completed).length
      const scored = data.filter(p => p.score !== null)
      const avgScore = scored.length ? scored.reduce((a,b) => a + b.score, 0) / scored.length : 0
      setStats({ completed, total: data.length, avgScore: Math.round(avgScore) })
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <span className="logo">atomcamp</span>
        <span className="greeting">Hi, {profile.name} 👋</span>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </header>

      <div className="stats-bar">
        <div className="stat"><span className="stat-num">{stats.completed}</span><span>Modules Done</span></div>
        <div className="stat"><span className="stat-num">{stats.avgScore}%</span><span>Avg Quiz Score</span></div>
        <div className="stat"><span className="stat-num">{studentProfile?.goal?.split(' ').slice(0,3).join(' ') || '—'}</span><span>Your Goal</span></div>
      </div>

      <nav className="tab-nav">
        <button className={activeTab === 'path' ? 'active' : ''} onClick={() => setActiveTab('path')}>My Learning Path</button>
        <button className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>All Courses</button>
      </nav>

      {activeTab === 'path' && <LearningPath profile={profile} studentProfile={studentProfile} onProgressUpdate={fetchStats} />}
      {activeTab === 'courses' && <AllCourses userId={profile.id} />}
      
      <AIChatbot profile={profile} studentProfile={studentProfile} />
    </div>
  )
}

function AllCourses({ userId }) {
  const [courses, setCourses] = useState([])
  
  useEffect(() => {
    supabase.from('courses').select('*').then(({ data }) => setCourses(data || []))
  }, [])

  async function enroll(courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .upsert({
      user_id: userId,
      course_id: courseId
    })

  if (error) {
    console.error(error)
    alert("Enrollment failed: " + error.message)
    return
  }

  alert('Enrolled successfully!')
}

  return (
    <div className="courses-grid">
      {courses.map(c => (
        <div key={c.id} className="course-card">
          <h3>{c.title}</h3>
          <p>{c.description}</p>
          <div className="course-meta">
            <span className={`badge ${c.difficulty}`}>{c.difficulty}</span>
            <span>{c.duration_weeks} weeks</span>
            <span className="target">{c.target_background}</span>
          </div>
          <button onClick={() => enroll(c.id)}>Enroll</button>
          {c.atomcamp_url ? (
            <button
                onClick={() =>
                window.open(c.atomcamp_url, '_blank', 'noopener,noreferrer')
                }
            >
                More Information
            </button>
            ) : (
            <button disabled>
                More Information Coming Soon
            </button>
            )}
        </div>
      ))}
    </div>
  )
}