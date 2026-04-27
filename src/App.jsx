import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [status, setStatus] = useState('Checking connection...')
  const [contentRows, setContentRows] = useState([])

  useEffect(() => {
    async function checkConnection() {
      const { data, error } = await supabase.from('content').select('*').limit(5)

      if (error) {
        setStatus(`Connected, but table check failed: ${error.message}`)
        return
      }

      setStatus('Connected to Supabase ✅')
      setContentRows(data ?? [])
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
        {contentRows.length > 0 ? (
          <table>
            <thead>
              <tr>
                {Object.keys(contentRows[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contentRows.map((row, index) => (
                <tr key={index}>
                  {Object.keys(contentRows[0]).map((key) => (
                    <td key={key}>{String(row[key] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="hint">No rows returned from the <code>content</code> table.</p>
        )}
      </section>
    </main>
  )
}

export default App
