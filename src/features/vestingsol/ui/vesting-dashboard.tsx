import { useState } from 'react'
import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, Wallet } from 'lucide-react'
import { VestingCreateForm } from './vesting-create-form'
import { VestingList } from './vesting-list'

export function VestingDashboard() {
  const { account } = useSolana()
  const [activeTab, setActiveTab] = useState('list')
  const [isCreating, setIsCreating] = useState(false)

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="hero py-[64px]">
          <div className="hero-content text-center space-y-6">
            <div>
              <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-4xl font-bold mb-2">Vesting Dashboard</h1>
              <p className="text-lg text-muted-foreground">
                Connect your wallet to manage token vesting schedules
              </p>
            </div>
            <WalletDropdown />
          </div>
        </div>
      </div>
    )
  }

  const handleCreateVesting = async (data: {
    amount: string
    startDate: string
    endDate: string
    periods: string
    periodDuration: string
  }) => {
    setIsCreating(true)
    try {
      // TODO: Implement actual vesting creation
      console.log('Creating vesting with data:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setActiveTab('list')
    } catch (error) {
      console.error('Error creating vesting:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClaim = async (address: string, storageAddress: string) => {
    try {
      console.log('Claiming from:', address, storageAddress)
      // TODO: Implement actual claim logic
    } catch (error) {
      console.error('Error claiming:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AppHero 
        title="Token Vesting Dashboard" 
        subtitle="Create and manage SOL vesting schedules on Solana"
      >
        <div className="flex gap-4 justify-center mt-6">
          <Button
            onClick={() => setActiveTab('create')}
            size="lg"
            className="gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Create Vesting Schedule
          </Button>
        </div>
      </AppHero>

      <div className="mt-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="list">My Vestings</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-8">
            <VestingList
              vestingRecords={[]}
              onClaim={handleClaim}
            />
          </TabsContent>

          <TabsContent value="create" className="mt-8">
            <VestingCreateForm
              onSubmit={handleCreateVesting}
              isLoading={isCreating}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
