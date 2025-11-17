/**
 * AddEmployeeDialog Component
 * Dialog form for adding new employees
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
import { UserPlus } from 'lucide-react'

interface AddEmployeeDialogProps {
  onSuccess?: () => void
}

export function AddEmployeeDialog({ onSuccess }: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [pin, setPin] = useState('')
  const [weekdayRate, setWeekdayRate] = useState('25.00')
  const [saturdayRate, setSaturdayRate] = useState('30.00')
  const [sundayRate, setSundayRate] = useState('35.00')

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setPin('')
    setWeekdayRate('25.00')
    setSaturdayRate('30.00')
    setSundayRate('35.00')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/client/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          pin,
          weekdayRate: parseFloat(weekdayRate),
          saturdayRate: parseFloat(saturdayRate),
          sundayRate: parseFloat(sundayRate),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to add employee')
        return
      }

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
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-neutral-800 border-neutral-700">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="bg-neutral-700 border-neutral-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="bg-neutral-700 border-neutral-600"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">4-Digit PIN *</Label>
            <Input
              id="pin"
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
              className="bg-neutral-700 border-neutral-600"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Pay Rates ($/hour)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weekdayRate" className="text-xs text-neutral-400">
                  Mon-Fri
                </Label>
                <Input
                  id="weekdayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={weekdayRate}
                  onChange={(e) => setWeekdayRate(e.target.value)}
                  className="bg-neutral-700 border-neutral-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saturdayRate" className="text-xs text-neutral-400">
                  Saturday
                </Label>
                <Input
                  id="saturdayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={saturdayRate}
                  onChange={(e) => setSaturdayRate(e.target.value)}
                  className="bg-neutral-700 border-neutral-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sundayRate" className="text-xs text-neutral-400">
                  Sunday
                </Label>
                <Input
                  id="sundayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sundayRate}
                  onChange={(e) => setSundayRate(e.target.value)}
                  className="bg-neutral-700 border-neutral-600"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded border border-red-500/20">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-neutral-700 border-neutral-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
