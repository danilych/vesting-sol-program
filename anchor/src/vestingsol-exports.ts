// Here we export some useful types and functions for interacting with the Anchor program.
import VestingSolProgramIDL from '../target/idl/vesting_sol_program.json'

// Re-export the generated IDL and type
export { VestingSolProgramIDL }

export * from './client/js'
