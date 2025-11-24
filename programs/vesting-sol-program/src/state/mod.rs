use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vesting {
    pub owner: Pubkey,
    pub treasury: Pubkey,
    pub creation_fee: u64,
}

#[account]
#[derive(InitSpace)]
pub struct VestingRecord {
    pub owner: Pubkey,
    pub amount: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub periods: u64,
    pub period_duration: u64,
    pub amount_per_period: u64
}