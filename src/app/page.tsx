'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(1)

        if (error) {
          setError(`Erro: ${error.message}`)
        } else {
          setConnected(true)
        }
      } catch (e) {
        setError(`Erro de conexão: ${String(e)}`)
      }
    }

    testConnection()
  }, [])

  return (
    <main className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🍕 Center Pizza</h1>
        {connected ? (
          <p className="text-green-600 text-lg">✅ Conectado ao Supabase!</p>
        ) : error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : (
          <p className="text-gray-600 text-lg">Testando conexão...</p>
        )}
      </div>
    </main>
  )
}