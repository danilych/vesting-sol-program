# Reusable Vesting Program for Tokens on Solana

### Motivation
I worked with vestings and ICOs so much, and boticed that there is no a lot of good open source implementations of vesting program which may be deployed and used for own goals.

### Features
- Everybody can create own vesting for token they have
- Time of one period, count of periods, token, receiver start date are fully configurable.
- User set as a receiver is able to claim token if some of them are unlocked alreadt, if not transaction will be reverted.
- It is possible to set unlock amount or percentage per period.
- It is possible to make vesting for group of users via merkle proofs.
- User pay creation fee to create vesting.
- 0.01% of vested tokens are sent to treasury wallet.