# Development Guide

## Overview

This project consists of a Solana token vesting program (in `vesting-sol-program`) and a React frontend (in `vesting-sol`).

## Project Structure

```
ackee/
├── vesting-sol-program/     # Original Anchor program
│   ├── programs/
│   │   └── vesting-sol-program/
│   │       └── src/         # Rust source code
│   └── target/
│       └── idl/             # Generated IDL
│
└── vesting-sol/             # Frontend application (main folder)
    ├── anchor/              # Copied program files
    │   ├── programs/
    │   │   └── vesting-sol-program/
    │   ├── src/
    │   │   └── client/      # Generated TypeScript client
    │   └── target/
    │       └── idl/         # Copied IDL
    │
    └── src/
        ├── components/      # Reusable UI components
        │   └── ui/          # Shadcn UI components
        └── features/
            └── vestingsol/  # Vesting feature module
                ├── data-access/  # React Query hooks
                └── ui/           # Feature UI components
```

## Current Status

### ✅ Completed

1. **Program Integration**: The vesting-sol-program has been integrated into the vesting-sol frontend folder
2. **IDL Generation**: TypeScript client generated from the Anchor IDL using Codama
3. **UI Components Created**:
   - `VestingDashboard` - Main dashboard with tabs
   - `VestingCreateForm` - Form to create new vesting schedules
   - `VestingCard` - Card component displaying vesting details
   - `VestingList` - Grid layout for multiple vesting schedules
4. **Build System**: Production build passes successfully
5. **Documentation**: README updated with project details

### 🚧 To Be Implemented

The UI components are created but the actual Solana transaction logic needs to be implemented:

1. **Create Vesting Hook** (`use-create-vesting.ts`):
   - Implement actual transaction using `getCreateVestingInstruction`
   - Handle wallet signing and transaction submission
   - Generate vesting record keypair
   - Transfer SOL to vesting storage PDA

2. **Claim Vesting Hook** (`use-claim-vesting.ts`):
   - Implement actual claim transaction using `getClaimInstruction`
   - Calculate claimable amount
   - Transfer tokens from storage to user

3. **Fetch Vesting Records** (`use-vesting-records.ts`):
   - Implement fetching using `fetchAllVestingRecord`
   - Filter by user's public key
   - Display in the dashboard

## Quick Start

### 1. Install Dependencies

```bash
cd /home/danilych/projects/ackee/vesting-sol
npm install
```

### 2. Build the Application

```bash
npm run build
```

### 3. Run Development Server

Note: Requires Node.js 20.19+ or 22.12+. If you have an older version, the build will still work but dev server may have issues.

```bash
npm run dev
```

### 4. Regenerate Client from IDL

If you make changes to the Anchor program:

```bash
# 1. Build the program to generate new IDL
cd /home/danilych/projects/ackee/vesting-sol-program
anchor build

# 2. Copy the IDL
cp target/idl/vesting_sol_program.json ../vesting-sol/anchor/target/idl/

# 3. Regenerate the TypeScript client
cd ../vesting-sol
npm run codama:js
```

## Key Files

### Frontend

- `src/features/vestingsol/vestingsol-feature.tsx` - Main feature entry point
- `src/features/vestingsol/ui/vesting-dashboard.tsx` - Main dashboard component
- `src/features/vestingsol/ui/vesting-create-form.tsx` - Vesting creation form
- `src/features/vestingsol/ui/vesting-card.tsx` - Individual vesting display
- `src/features/vestingsol/data-access/use-create-vesting.ts` - Create vesting mutation (TODO: implement)
- `src/features/vestingsol/data-access/use-claim-vesting.ts` - Claim vesting mutation (TODO: implement)
- `src/features/vestingsol/data-access/use-vesting-records.ts` - Fetch records query (TODO: implement)

### Generated Client

- `anchor/src/client/js/generated/` - Auto-generated TypeScript client from IDL
  - `instructions/createVesting.ts` - Create vesting instruction builder
  - `instructions/claim.ts` - Claim instruction builder
  - `accounts/vestingRecord.ts` - Vesting record account type
  - `programs/vestingSolProgram.ts` - Program constants

## Next Steps

1. **Implement Transaction Logic**: Update the data-access hooks to use actual Solana transactions
2. **Add Initialize Function**: Create admin UI to initialize the vesting program
3. **Error Handling**: Add proper error messages and user feedback
4. **Testing**: Add integration tests for the program interactions
5. **Deployment**: Deploy to Devnet and test with real transactions

## Notes

- The UI is fully functional and builds successfully
- Wallet integration is ready (using Wallet UI)
- All components are styled with TailwindCSS and Shadcn UI
- The program client is auto-generated from the IDL using Codama
- Transaction logic is stubbed out with TODO comments for easy implementation
