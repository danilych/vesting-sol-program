import { useMemo } from 'react'
import { useSolana } from '@/components/solana/use-solana'
import { VESTING_SOL_PROGRAM_PROGRAM_ADDRESS } from '@project/anchor'

export function useVestingProgram() {
  const { client, account } = useSolana()

  const programId = useMemo(
    () => VESTING_SOL_PROGRAM_PROGRAM_ADDRESS,
    []
  )

  return {
    client,
    account,
    programId,
  }
}
