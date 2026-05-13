import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard({ profile }) {
  const [stats, setStats] = useState({
    total_students: 0,
    total_enrollments: 0,
    avg_completion: 0,
    total_courses: 0
  })
  const [courses, setCourses] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetchStats()
    fetchCourses()
    fetchUsers()
  }, [])

  async function fetchStats() {
    const [{ count: students }, { count: enrollments }, { count: courses }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true })
    ])
    setStats({
      total_students: students || 0,
      total_enrollments: enrollments || 0,
      total_courses: courses || 0
    })
  }

  async function fetchCourses() {
    const { data } = await supabase.from('courses').select('*')
    setCourses(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <span className="logo">atomcamp</span>
        <span>Admin: {profile.name}</span>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </header>

      {/* Stats Cards */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-num">{stats.total_students}</span>
          <span>Total Students</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-num">{stats.total_enrollments}</span>
          <span>Total Enrollments</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-num">{stats.total_courses}</span>
          <span>Active Courses</span>
        </div>
      </div>

      {/* Courses Table */}
      <div className="admin-section">
        <h3>All Courses</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Target</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td><span className={`badge ${c.difficulty}`}>{c.difficulty}</span></td>
                <td>{c.target_background}</td>
                <td>{c.duration_weeks} weeks</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Users Table */}
      <div className="admin-section">
        <h3>All Users</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}