use anchor_lang::prelude::*;
use anchor_lang::prelude::Clock;

use crate::state::VestingRecord;
use crate::state::Vesting;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct CreateVesting<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(init, payer = owner, space = 8 + VestingRecord::INIT_SPACE)]
    pub vesting_record: Account<'info, VestingRecord>,
    pub vesting: Account<'info, Vesting>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateVesting>, amount: u64, start_time: u64, end_time: u64, periods: u64, period_duration: u64, amount_per_period: u64) -> Result<()> {
    let clock = Clock::get()?;

    require!(amount > 0, ErrorCode::InvalidAmount);
    require!(start_time >= clock.unix_timestamp as u64, ErrorCode::InvalidStartTimestamp);
    require!(end_time > start_time, ErrorCode::InvalidEndTimestamp);
    require!(periods > 0, ErrorCode::InvalidPeriodsConfiguration);
    require!(periods.checked_mul(amount_per_period).unwrap() == amount, ErrorCode::InvalidPeriodsConfiguration);
    require!(period_duration > 0, ErrorCode::InvalidPeriodsConfiguration);

    let vesting_record = &mut ctx.accounts.vesting_record;
    vesting_record.owner = ctx.accounts.owner.key();
    vesting_record.amount = amount;
    vesting_record.start_time = start_time;
    vesting_record.end_time = end_time;
    vesting_record.periods = periods;
    vesting_record.period_duration = period_duration;
    vesting_record.amount_per_period = amount_per_period;

    Ok(())
}
