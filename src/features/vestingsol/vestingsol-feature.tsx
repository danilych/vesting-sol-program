import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { VestingsolUiProgramExplorerLink } from './ui/vestingsol-ui-program-explorer-link'
import { VestingsolUiCreate } from './ui/vestingsol-ui-create'
import { VestingsolUiProgram } from '@/features/vestingsol/ui/vestingsol-ui-program'

export default function VestingsolFeature() {
  const { account } = useSolana()

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="hero py-[64px]">
          <div className="hero-content text-center">
            <WalletDropdown />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="Vestingsol" subtitle={'Run the program by clicking the "Run program" button.'}>
        <p className="mb-6">
          <VestingsolUiProgramExplorerLink />
        </p>
        <VestingsolUiCreate account={account} />
      </AppHero>
      <VestingsolUiProgram />
    </div>
  )
}
