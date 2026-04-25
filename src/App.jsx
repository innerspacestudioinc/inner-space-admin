import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [status, setStatus] = useState('Checking connection...')

  useEffect(() => {
    async function checkConnection() {
      const { error } = await supabase.from('profiles').select('id').limit(1)

      if (error) {
        setStatus(`Connected, but table check failed: ${error.message}`)
        return
      }

      setStatus('Connected to Supabase ✅')
    }

    checkConnection()
  }, [])

  return (
    <main className="page">
      <h1>Inner Space Admin Dashboard</h1>
      <p>This is your starter admin dashboard.</p>

      <section className="card">
        <h2>Supabase status</h2>
        <p>{status}</p>
        <p className="hint">
          Note: This starter checks a table named <code>profiles</code>. If you use a different table,
          we can change this in the next step.
        </p>
      </section>
    </main>
  )
}

export default App
