/**
 * Admin Dashboard Page
 * Main dashboard for admin portal
 * Features:
 * - Stats overview (total clients, active clients, etc.)
 * - Client list table
 * - Add new client functionality
 * - Edit/Delete client actions
 */
'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from './components/StatsCards'
import { ClientList } from './components/ClientList'
import { NewClientDialog } from './components/NewClientDialog'
import { Clock } from 'lucide-react'
import type { Client } from '@/types/database'

export default function AdminDashboardPage() {
  const [clients, setClients] = useState<(Client & { employees?: { count: number }[] })[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * Fetch clients from API
   */
  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/clients')
      const data = await response.json()

      if (response.ok) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load clients on mount
  useEffect(() => {
    fetchClients()
  }, [])

  /**
   * Calculate stats from clients data
   */
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    totalEmployees: clients.reduce((sum, c) => sum + (c.employees?.[0]?.count || 0), 0),
    inactiveClients: clients.filter(c => c.status === 'inactive').length
  }

  /**
   * Handle edit client action
   */
  const handleEdit = (client: Client) => {
    // TODO: Implement edit dialog
    console.log('Edit client:', client)
  }

  /**
   * Handle delete client action
   */
  const handleDelete = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete ${client.business_name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh client list
        fetchClients()
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">TimeTally Admin</h1>
                <p className="text-sm text-neutral-400">Client Management Dashboard</p>
              </div>
            </div>

            {/* Add New Client Button */}
            <NewClientDialog onSuccess={fetchClients} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <StatsCards
              totalClients={stats.totalClients}
              activeClients={stats.activeClients}
              totalEmployees={stats.totalEmployees}
              inactiveClients={stats.inactiveClients}
            />
          </section>

          {/* Client List */}
          <section>
            <h2 className="text-xl font-semibold mb-4">All Clients</h2>
            {loading ? (
              <div className="text-center py-12 text-neutral-400">
                Loading clients...
              </div>
            ) : (
              <ClientList
                clients={clients}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
