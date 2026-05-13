import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()

    if (loading) return   // ✅ prevent double submit

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
        data: { name, 
            role}
        }
    })

    setLoading(false)

    if (error) {
        setError(error.message)
        return
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="https://www.atomcamp.com/wp-content/uploads/2022/10/logo.atomcamp.png" alt="atomcamp" className="login-logo" />
        <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        
        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {isRegister && (
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          )}
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <p onClick={() => setIsRegister(!isRegister)} className="toggle-link">
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  )
}