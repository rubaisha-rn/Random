import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function InstructorDashboard({ profile }) {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [students, setStudents] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(false)

  useEffect(() => {
    supabase.from('courses').select('*').eq('instructor_id', profile.id).then(({ data }) => setCourses(data || []))
  }, [])

  async function selectCourse(course) {
    setSelectedCourse(course)
    await fetchStudentsAndAlerts(course.id)
  }

  async function fetchStudentsAndAlerts(courseId) {
    setAlertsLoading(true)
    
    // Get enrolled students with their progress stats
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id, profiles(id, name)')
      .eq('course_id', courseId)

    const studentIds = enrollments?.map(e => e.user_id) || []
    
    if (!studentIds.length) { setAlertsLoading(false); return }

    const { data: progressData } = await supabase
      .from('progress')
      .select('*')
      .in('user_id', studentIds)

    // Build stats per student
    const studentStats = (enrollments || []).map(e => {
      const sp = progressData?.filter(p => p.user_id === e.user_id) || []
      const scored = sp.filter(p => p.score != null)
      return {
        student_id: e.user_id,
        student_name: e.profiles?.name,
        avg_score: scored.length ? scored.reduce((a,b) => a+b.score, 0) / scored.length : null,
        completed_count: sp.filter(p => p.completed).length,
        total_attempts: sp.reduce((a,b) => a + b.attempts, 0),
        last_activity: sp.map(p => p.completed_at).filter(Boolean).sort().reverse()[0] || null
      }
    })
    setStudents(studentStats)

    const response = await fetch('/api/ai-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: studentStats })
    })

    const alertsData = await response.json()
    setAlerts(Array.isArray(alertsData) ? alertsData : [])
    setAlertsLoading(false)
  }

  return (
    <div className="dashboard instructor">
      <header className="dashboard-header">
        <span className="logo">atomcamp</span>
        <span>Instructor: {profile.name}</span>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </header>

      <div className="instructor-layout">
        <aside className="course-list">
          <h3>Your Courses</h3>
          {courses.map(c => (
            <div
              key={c.id}
              className={`course-item ${selectedCourse?.id === c.id ? 'active' : ''}`}
              onClick={() => selectCourse(c)}
            >
              {c.title}
            </div>
          ))}
        </aside>

        <main className="instructor-main">
          {!selectedCourse ? (
            <div className="empty-state">Select a course to see student analytics</div>
          ) : (
            <>
              <h2>{selectedCourse.title} — Student Overview</h2>
              
              {alertsLoading ? (
                <div className="ai-loading">
                  <div className="spinner" />
                  <p>AI is analyzing {students.length} students for early warning signals...</p>
                </div>
              ) : (
                <>
                  {alerts.length > 0 && (
                    <div className="alerts-panel">
                      <h3>⚠️ AI Early Warning Alerts ({alerts.length})</h3>
                      {alerts.map((a, i) => (
                        <div key={i} className={`alert-card ${a.risk_level}`}>
                          <div className="alert-header">
                            <strong>{a.student_name}</strong>
                            <span className={`risk-badge ${a.risk_level}`}>{a.risk_level} risk</span>
                          </div>
                          <p className="alert-reason">{a.reason}</p>
                          <p className="alert-rec">💡 {a.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="students-table">
                    <h3>All Students ({students.length})</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Avg Score</th>
                          <th>Modules Completed</th>
                          <th>Total Attempts</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(s => {
                          const alert = alerts.find(a => a.student_id === s.student_id)
                          return (
                            <tr key={s.student_id} className={alert ? `risk-${alert.risk_level}` : ''}>
                              <td>{s.student_name}</td>
                              <td>{s.avg_score != null ? Math.round(s.avg_score) + '%' : 'N/A'}</td>
                              <td>{s.completed_count}</td>
                              <td>{s.total_attempts}</td>
                              <td>
                                {alert
                                  ? <span className={`status-badge ${alert.risk_level}`}>{alert.risk_level} risk</span>
                                  : <span className="status-badge ok">On Track</span>
                                }
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}