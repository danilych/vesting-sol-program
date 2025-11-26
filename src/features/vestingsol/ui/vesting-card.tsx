import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Clock, CoinsIcon, TrendingUp } from 'lucide-react'
import { formatDistance } from 'date-fns'

interface VestingCardProps {
  vestingRecord: {
    address: string
    amount: bigint
    startTime: bigint
    endTime: bigint
    periods: bigint
    periodDuration: bigint
    amountPerPeriod: bigint
    claimedAmount: bigint
  }
  onClaim: () => void
  isClaiming?: boolean
}

export function VestingCard({ vestingRecord, onClaim, isClaiming }: VestingCardProps) {
  const now = BigInt(Math.floor(Date.now() / 1000))
  const startDate = new Date(Number(vestingRecord.startTime) * 1000)
  const endDate = new Date(Number(vestingRecord.endTime) * 1000)
  
  // Calculate claimable amount
  const isStarted = now >= vestingRecord.startTime
  const elapsedTime = isStarted ? now - vestingRecord.startTime : 0n
  const periodsPassed = vestingRecord.periodDuration > 0n 
    ? elapsedTime / vestingRecord.periodDuration 
    : 0n
  const claimablePeriods = periodsPassed < vestingRecord.periods ? periodsPassed : vestingRecord.periods
  const totalClaimable = claimablePeriods * vestingRecord.amountPerPeriod
  const availableToClaim = totalClaimable - vestingRecord.claimedAmount
  
  const totalAmount = Number(vestingRecord.amount) / 1e9 // Convert lamports to SOL
  const claimedAmount = Number(vestingRecord.claimedAmount) / 1e9
  const availableAmount = Number(availableToClaim) / 1e9
  const progressPercent = (claimedAmount / totalAmount) * 100

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CoinsIcon className="w-5 h-5" />
            Vesting Schedule
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {vestingRecord.address.slice(0, 4)}...{vestingRecord.address.slice(-4)}
          </span>
        </CardTitle>
        <CardDescription>
          {isStarted ? 'Active vesting schedule' : 'Scheduled to start'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vested Progress</span>
            <span className="font-medium">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CoinsIcon className="w-3 h-3" />
              Total Amount
            </p>
            <p className="text-lg font-bold">{totalAmount.toFixed(4)} SOL</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Claimed
            </p>
            <p className="text-lg font-bold">{claimedAmount.toFixed(4)} SOL</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Periods
            </p>
            <p className="text-sm font-medium">
              {claimablePeriods.toString()} / {vestingRecord.periods.toString()}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              Duration
            </p>
            <p className="text-sm font-medium">
              {formatDistance(startDate, endDate)}
            </p>
          </div>
        </div>

        {/* Available to Claim */}
        {availableAmount > 0 && (
          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Available to Claim</p>
            <p className="text-2xl font-bold text-primary">{availableAmount.toFixed(6)} SOL</p>
          </div>
        )}

        {/* Timeline */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>Start:</span>
            <span>{startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>End:</span>
            <span>{endDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Per Period:</span>
            <span>{(Number(vestingRecord.amountPerPeriod) / 1e9).toFixed(6)} SOL</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={onClaim} 
          disabled={availableAmount <= 0 || isClaiming}
          className="w-full"
          size="lg"
        >
          {isClaiming ? 'Claiming...' : availableAmount > 0 ? 'Claim Tokens' : 'Nothing to Claim'}
        </Button>
      </CardFooter>
    </Card>
  )
}
