/**
 * Manager Login Page
 * PIN-based authentication for managers
 * Features:
 * - PIN pad for secure PIN entry
 * - Session creation on successful login
 * - Redirect to manager dashboard
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PinPad } from '@/components/PinPad'
import { Label } from '@/components/ui/label'
import { Clock, Shield } from 'lucide-react'

export default function ManagerLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Handle PIN completion
   * Automatically triggered when PIN is fully entered
   */
  const handlePinComplete = async (pin: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/client/auth/manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid PIN')
        return
      }

      // Redirect to manager dashboard on success
      router.push('/client/manager/dashboard')
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle PIN clear
   * Reset error state when user clears PIN
   */
  const handlePinClear = () => {
    setError('')
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">Manager Access</h1>
          <p className="text-neutral-400">Enter your manager PIN</p>
        </div>

        {/* PIN Pad */}
        <div>
          <Label className="mb-4 block text-center">Enter Manager PIN</Label>
          <PinPad
            length={4}
            onComplete={handlePinComplete}
            onClear={handlePinClear}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded border border-red-500/20 text-center">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-neutral-400">
            Authenticating...
          </div>
        )}

        {/* Back Link */}
        <div className="text-center">
          <a
            href="/client"
            className="text-sm text-neutral-400 hover:text-primary transition-colors"
          >
            ← Back to portal selection
          </a>
        </div>
      </div>
    </div>
  )
}
