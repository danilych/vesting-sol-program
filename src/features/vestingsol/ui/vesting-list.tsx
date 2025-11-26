import { VestingCard } from './vesting-card'

interface VestingListProps {
  vestingRecords: Array<{
    address: string
    amount: bigint
    startTime: bigint
    endTime: bigint
    periods: bigint
    periodDuration: bigint
    amountPerPeriod: bigint
    claimedAmount: bigint
  }>
  onClaim: (address: string, storageAddress: string) => void
  claimingAddress?: string
}

export function VestingList({ vestingRecords, onClaim, claimingAddress }: VestingListProps) {
  if (vestingRecords.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No vesting schedules found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first vesting schedule to get started
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vestingRecords.map((record) => (
        <VestingCard
          key={record.address}
          vestingRecord={record}
          onClaim={() => onClaim(record.address, record.address)}
          isClaiming={claimingAddress === record.address}
        />
      ))}
    </div>
  )
}
