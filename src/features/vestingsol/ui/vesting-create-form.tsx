import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Clock, CoinsIcon } from 'lucide-react'

interface VestingCreateFormProps {
  onSubmit: (data: {
    amount: string
    startDate: string
    endDate: string
    periods: string
    periodDuration: string
  }) => void
  isLoading?: boolean
}

export function VestingCreateForm({ onSubmit, isLoading }: VestingCreateFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    startDate: '',
    endDate: '',
    periods: '',
    periodDuration: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CoinsIcon className="w-6 h-6" />
          Create Vesting Schedule
        </CardTitle>
        <CardDescription>
          Set up a new token vesting schedule with periodic unlocks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <CoinsIcon className="w-4 h-4" />
              Total Amount (SOL)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="10.0"
              value={formData.amount}
              onChange={handleChange('amount')}
              required
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground">
              Total amount of SOL to vest
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleChange('startDate')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleChange('endDate')}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periods" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Number of Periods
              </Label>
              <Input
                id="periods"
                type="number"
                min="1"
                placeholder="12"
                value={formData.periods}
                onChange={handleChange('periods')}
                required
              />
              <p className="text-sm text-muted-foreground">
                Total unlock periods
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodDuration" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Period Duration (seconds)
              </Label>
              <Input
                id="periodDuration"
                type="number"
                min="1"
                placeholder="2592000"
                value={formData.periodDuration}
                onChange={handleChange('periodDuration')}
                required
              />
              <p className="text-sm text-muted-foreground">
                30 days = 2,592,000 seconds
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Vesting Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Amount per period:</div>
              <div className="font-medium">
                {formData.amount && formData.periods
                  ? (parseFloat(formData.amount) / parseInt(formData.periods)).toFixed(6)
                  : '0.000000'}{' '}
                SOL
              </div>
              <div className="text-muted-foreground">Unlock frequency:</div>
              <div className="font-medium">
                {formData.periodDuration
                  ? `Every ${parseInt(formData.periodDuration) / 86400} days`
                  : 'Not set'}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Vesting Schedule'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
