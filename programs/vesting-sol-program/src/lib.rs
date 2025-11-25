pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("E9W68mi2czVLckqc6EpNG6sdQnVqLVhtvKig9XkEzeGk");

#[program]
pub mod vesting_sol_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, creation_fee: u64) -> Result<()> {
        initialize::handler(ctx, creation_fee)
    }

    pub fn create_vesting(ctx: Context<CreateVesting>, amount: u64, start_time: u64, end_time: u64, periods: u64, period_duration: u64, amount_per_period: u64) -> Result<()> {
        create_vesting::handler(ctx, amount, start_time, end_time, periods, period_duration, amount_per_period)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }
}
