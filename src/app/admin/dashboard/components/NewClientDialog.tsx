/**
 * NewClientDialog Component
 * Dialog form for creating new clients
 * Features:
 * - Business name and contact email (required)
 * - Optional custom subdomain
 * - Optional manager PIN (defaults to 0000)
 * - Auto-generates subdomain from business name
 */
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

interface NewClientDialogProps {
  onSuccess?: () => void
}

export function NewClientDialog({ onSuccess }: NewClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [managerPin, setManagerPin] = useState('')

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setBusinessName('')
    setContactEmail('')
    setSubdomain('')
    setManagerPin('')
    setError('')
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          contactEmail,
          subdomain: subdomain || undefined,
          managerPin: managerPin || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create client')
        return
      }

      // Success - close dialog and reset form
      setOpen(false)
      resetForm()
      onSuccess?.()
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-neutral-800 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-white">Business Name *</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Corporation"
              className="bg-white text-black border-neutral-600"
              required
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-white">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="manager@acme.com"
              className="bg-white text-black border-neutral-600"
              required
            />
          </div>

          {/* Subdomain (optional) */}
          <div className="space-y-2">
            <Label htmlFor="subdomain" className="text-white">
              Subdomain (optional)
              <span className="text-xs text-neutral-400 ml-2">
                Auto-generated if left blank
              </span>
            </Label>
            <Input
              id="subdomain"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
              placeholder="acme"
              className="bg-white text-black border-neutral-600"
            />
            {subdomain && (
              <p className="text-xs text-neutral-400">
                Will be accessible at: {subdomain}.timetally.com
              </p>
            )}
          </div>

          {/* Manager PIN (optional) */}
          <div className="space-y-2">
            <Label htmlFor="managerPin" className="text-white">
              Manager PIN (optional)
              <span className="text-xs text-neutral-400 ml-2">
                Defaults to 0000
              </span>
            </Label>
            <Input
              id="managerPin"
              type="text"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              maxLength={4}
              className="bg-white text-black border-neutral-600"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded border border-red-500/20">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-white text-black border-neutral-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary-600"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
