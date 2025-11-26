# Solana Token Vesting DApp

A modern, full-featured token vesting application built on Solana. This dApp allows users to create and manage SOL vesting schedules with periodic unlocking.

## Features

- **Create Vesting Schedules**: Set up custom token vesting with configurable periods and durations
- **Claim Tokens**: Easily claim vested tokens as they become available
- **Dashboard View**: Monitor all your vesting schedules in one place
- **Modern UI**: Built with React, Vite, TailwindCSS, and Shadcn UI
- **Wallet Integration**: Seamless wallet connection with [Wallet UI](https://registry.wallet-ui.dev)
- **Solana SDK**: Powered by [Gill](https://gill.site/) Solana SDK
- **Type-Safe**: Full TypeScript support with auto-generated client from IDL

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4 + Shadcn UI Components
- **Blockchain**: Solana (Anchor Framework 0.32)
- **Wallet**: Wallet UI for React
- **Code Generation**: [Codama](https://github.com/codama-idl/codama) for IDL-to-TypeScript client

## Getting Started

### Installation

#### Download the template

```shell
npx create-solana-dapp@latest -t gh:solana-foundation/templates/gill/vesting-sol
```

#### Install Dependencies

```shell
npm install
```

## Apps

### anchor

This is a Solana vesting program written in Rust using the Anchor framework. It manages token vesting schedules with:

- **Initialize**: Set up the vesting program with creation fees and treasury
- **Create Vesting**: Create new vesting schedules with customizable periods
- **Claim**: Allow beneficiaries to claim unlocked tokens
- **Admin Functions**: Update fees, treasury, and transfer ownership

#### Commands

You can use any normal anchor commands. Either move to the `anchor` directory and run the `anchor` command or prefix the
command with `npm`, eg: `npm run anchor`.

#### Sync the program id:

Running this command will create a new keypair in the `anchor/target/deploy` directory and save the address to the
Anchor config file and update the `declare_id!` macro in the `./src/lib.rs` file of the program. This will also update
the constant in the `anchor/src/vestingsol-exports.ts` file.

```shell
npm run setup
```

```shell
npm run anchor keys sync
```

#### Build the program:

```shell
npm run anchor-build
```

#### Start the test validator with the program deployed:

```shell
npm run anchor-localnet
```

#### Run the tests

```shell
npm run anchor-test
```

#### Deploy to Devnet

```shell
npm run anchor deploy --provider.cluster devnet
```

### web

A modern React app with a beautiful dashboard for managing vesting schedules:

- **Vesting Dashboard**: View all your active and scheduled vesting programs
- **Create Form**: Intuitive form to create new vesting schedules
- **Claim Interface**: One-click claiming of available tokens
- **Real-time Updates**: Live progress tracking for all vesting schedules
- **Responsive Design**: Works seamlessly on desktop and mobile

#### Commands

Start the app

```shell
npm run dev
```

Build the app

```shell
npm run build
```
