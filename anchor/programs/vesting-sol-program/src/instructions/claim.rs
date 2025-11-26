use anchor_lang::prelude::*;
use anchor_lang::prelude::Clock;
use anchor_lang::system_program;

use crate::state::{VestingRecord, VestingStorage};
use crate::error::ErrorCode;
use crate::constants::VESTING_STORAGE_SEED;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        constraint = vesting_record.owner == owner.key() @ ErrorCode::CustomError
    )]
    pub vesting_record: Account<'info, VestingRecord>,
    #[account(
        mut,
        seeds = [VESTING_STORAGE_SEED.as_bytes(), vesting_record.key().as_ref()],
        bump = vesting_storage.bump
    )]
    pub vesting_storage: Account<'info, VestingStorage>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    let clock = Clock::get()?;
    let vesting_record = &mut ctx.accounts.vesting_record;
    let vesting_storage = &ctx.accounts.vesting_storage;
    
    let current_time = clock.unix_timestamp as u64;
    require!(current_time >= vesting_record.start_time, ErrorCode::InvalidStartTimestamp);
    
    let elapsed_time = current_time.saturating_sub(vesting_record.start_time);
    let periods_passed = elapsed_time.checked_div(vesting_record.period_duration).unwrap();
    let claimable_periods = std::cmp::min(periods_passed, vesting_record.periods);
    let total_claimable = claimable_periods
        .checked_mul(vesting_record.amount_per_period)
        .unwrap();
    
    let claimable_amount = total_claimable.saturating_sub(vesting_record.claimed_amount);
    require!(claimable_amount > 0, ErrorCode::InvalidAmount);
    
    let vesting_record_key = vesting_record.key();
    let seeds = &[
        VESTING_STORAGE_SEED.as_bytes(),
        vesting_record_key.as_ref(),
        &[vesting_storage.bump],
    ];
    let signer = &[&seeds[..]];
    
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vesting_storage.to_account_info(),
                to: ctx.accounts.owner.to_account_info(),
            },
            signer,
        ),
        claimable_amount,
    )?;
    
    vesting_record.claimed_amount = vesting_record.claimed_amount
        .checked_add(claimable_amount)
        .unwrap();
    
    Ok(())
}
