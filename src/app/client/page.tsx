/**
 * Client Portal Landing Page
 * Entry point for client subdomains (e.g., acme.timetally.com)
 * Features:
 * - Welcome message with business name
 * - Two login options: Employee and Manager
 * - Navigation to respective login pages
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Clock, Users, Shield, Lock } from 'lucide-react'

export default function ClientLandingPage() {
  const [businessName, setBusinessName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  /**
   * Fetch client information on mount
   */
  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        // In a real implementation, you'd fetch this from an API endpoint
        // For now, we'll use a placeholder
        setBusinessName('Welcome')
      } catch (error) {
        console.error('Error fetching client info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClientInfo()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Clock className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">TimeTally</h1>
          <p className="text-xl text-neutral-400">Payroll Management System</p>
        </div>

        {/* Login Options */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Employee Login Card */}
          <Link href="/client/employee/login">
            <Card className="p-8 bg-neutral-800 border-neutral-700 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Users className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white">Employee Login</h2>
                <p className="text-neutral-400">
                  Submit your weekly timesheet 
                </p>
                <div className="pt-4">
                  <div className="inline-block px-6 py-2 bg-primary rounded-lg text-white">
                    Login with PIN
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          {/* Manager Login Card */}
          <Link href="/client/manager/login">
            <Card className="p-8 bg-neutral-800 border-neutral-700 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Lock className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white">Manager Access</h2>
                <p className="text-neutral-400">
                  Review and export payroll data
                </p>
                <div className="pt-4">
                  <div className="inline-block px-6 py-2 bg-primary rounded-lg text-white">
                    Manager Login
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-neutral-500 text-sm">
          <p>2025 © TimeTally. | Built by <a href="https://stashlabs.com.au" target="_blank" rel="noopener noreferrer" className=" hover:underline">Stash Labs.</a></p>
        </div>
      </div>
    </div>
  )
}
