import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import InstructorDashboard from './pages/InstructorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import Onboarding from './pages/Onboarding'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()  

    if (error) {
        console.log("Profile error:", error)
        setLoading(false)
        return
    }

    if (!data) {
        console.log("No profile found — sending to onboarding")
        setProfile(null)
        setLoading(false)
        return
    }

    setProfile(data)
    setLoading(false)
    }

  if (loading) return <div>Loading...</div>

  if (!session) return <Login />

  if (!profile) {
    return <Onboarding profile={{ id: session.user.id }} />
    }

    if (profile.role === 'student' && !profile.onboarded) {
        return <Onboarding profile={profile} />
    }

  if (profile.role === 'student') return <StudentDashboard profile={profile} />
  if (profile.role === 'instructor') return <InstructorDashboard profile={profile} />
  if (profile.role === 'admin') return <AdminDashboard profile={profile} />

  return <div>Unknown role: {profile.role}</div>
}