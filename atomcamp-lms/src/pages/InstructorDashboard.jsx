import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function InstructorDashboard({ profile }) {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [students, setStudents] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(false)

  useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', profile.id)

      if (!error) setCourses(data || [])
    }

    loadCourses()
  }, [profile.id])

  async function selectCourse(course) {
    setSelectedCourse(course)
    await fetchStudentsAndAlerts(course.id)
  }

  async function fetchStudentsAndAlerts(courseId) {
    setAlertsLoading(true)
    setAlerts([])
    setStudents([])

    try {
      // 1. Get enrollments (NO JOIN — reliable)
      const { data: enrollments, error: enrollErr } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('course_id', courseId)

      if (enrollErr) throw enrollErr

      const studentIds = (enrollments || []).map(e => e.user_id)

      if (!studentIds.length) {
        setAlerts([])
        setStudents([])
        return
      }

      // 2. Get profiles separately (FIX FOR "Unknown")
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', studentIds)

      if (profileErr) throw profileErr

      const profileMap = {}
      profiles?.forEach(p => {
        profileMap[p.id] = p.name
      })

      // 3. Get progress
      const { data: progressData, error: progErr } = await supabase
        .from('progress')
        .select('*')
        .in('user_id', studentIds)

      if (progErr) throw progErr

      // 4. Build student stats
      const studentStats = (enrollments || []).map(e => {
        const sp = (progressData || []).filter(
          p => p.user_id === e.user_id
        )

        const scored = sp.filter(
          p => p.score !== null && p.score !== undefined
        )

        const avgScore = scored.length
          ? scored.reduce((sum, p) => sum + Number(p.score || 0), 0) /
            scored.length
          : null

        const completedCount = sp.filter(p => p.completed).length

        const totalAttempts = sp.reduce(
          (sum, p) => sum + (p.attempts || 0),
          0
        )

        const lastActivity =
          sp
            .map(p => p.completed_at)
            .filter(Boolean)
            .sort()
            .reverse()[0] || null

        return {
          student_id: e.user_id,
          student_name: profileMap[e.user_id] || 'Unknown',
          avg_score: avgScore,
          completed_count: completedCount,
          total_attempts: totalAttempts,
          last_activity: lastActivity
        }
      })

      setStudents(studentStats)

      // 5. AI ALERTS CALL
      const response = await fetch('/api/ai-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentStats })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const alertsData = await response.json()

      setAlerts(Array.isArray(alertsData) ? alertsData : [])
    } catch (err) {
      console.error('Instructor dashboard error:', err)
      setAlerts([])
    } finally {
      setAlertsLoading(false)
    }
  }

  return (
    <div className="dashboard instructor">
      <header className="dashboard-header">
        <span className="logo">atomcamp</span>
        <span>Instructor: {profile.name}</span>
        <button onClick={() => supabase.auth.signOut()}>
          Sign Out
        </button>
      </header>

      <div className="instructor-layout">
        <aside className="course-list">
          <h3>Your Courses</h3>

          {courses.map(course => (
            <div
              key={course.id}
              className={`course-item ${
                selectedCourse?.id === course.id ? 'active' : ''
              }`}
              onClick={() => selectCourse(course)}
            >
              {course.title}
            </div>
          ))}
        </aside>

        <main className="instructor-main">
          {!selectedCourse ? (
            <div className="empty-state">
              Select a course to see student analytics
            </div>
          ) : (
            <>
              <h2>
                {selectedCourse.title} — Student Overview
              </h2>

              {alertsLoading ? (
                <div className="ai-loading">
                  <div className="spinner" />
                  <p>
                    AI is analyzing {students.length} students...
                  </p>
                </div>
              ) : (
                <>
                  {alerts.length > 0 && (
                    <div className="alerts-panel">
                      <h3>
                        ⚠️ AI Alerts ({alerts.length})
                      </h3>

                      {alerts.map((a, i) => (
                        <div
                          key={i}
                          className={`alert-card ${a.risk_level}`}
                        >
                          <div className="alert-header">
                            <strong>{a.student_name}</strong>
                            <span
                              className={`risk-badge ${a.risk_level}`}
                            >
                              {a.risk_level} risk
                            </span>
                          </div>

                          <p>{a.reason}</p>
                          <p>💡 {a.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="students-table">
                    <h3>
                      All Students ({students.length})
                    </h3>

                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Avg Score</th>
                          <th>Completed</th>
                          <th>Attempts</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {students.map(s => {
                          const alert = alerts.find(
                            a => a.student_id === s.student_id
                          )

                          return (
                            <tr
                              key={s.student_id}
                              className={
                                alert
                                  ? `risk-${alert.risk_level}`
                                  : ''
                              }
                            >
                              <td>{s.student_name}</td>
                              <td>
                                {s.avg_score != null
                                  ? Math.round(s.avg_score) + '%'
                                  : 'N/A'}
                              </td>
                              <td>{s.completed_count}</td>
                              <td>{s.total_attempts}</td>
                              <td>
                                {alert ? (
                                  <span
                                    className={`status-badge ${alert.risk_level}`}
                                  >
                                    {alert.risk_level} risk
                                  </span>
                                ) : (
                                  <span className="status-badge ok">
                                    On Track
                                  </span>
                                )}
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