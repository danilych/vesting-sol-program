import { VESTING_SOL_PROGRAM_PROGRAM_ADDRESS } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { useTransactionToast } from '@/components/use-transaction-toast'

export function useGreetMutation() {
  const { account } = useSolana()
  const toast = useTransactionToast()

  return useMutation({
    mutationKey: ['greet'],
    mutationFn: async () => {
      if (!account) {
        throw new Error('Wallet is not connected')
      }

      // TODO: Implement actual greet instruction
      console.log('Program address:', VESTING_SOL_PROGRAM_PROGRAM_ADDRESS)
      return 'simulated_signature'
    },
    onSuccess: (signature) => {
      toast(signature)
    },
  })
}
