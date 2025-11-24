use anchor_lang::prelude::*;
use crate::state::Vesting;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + Vesting::INIT_SPACE)]
    pub vesting: Account<'info, Vesting>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: Treasury account that will receive creation fees
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, creation_fee: u64) -> Result<()> {
    require!(creation_fee > 0, ErrorCode::InvalidAmount);

    let vesting = &mut ctx.accounts.vesting;
    vesting.owner = ctx.accounts.owner.key();
    vesting.treasury = ctx.accounts.treasury.key();
    vesting.creation_fee = creation_fee;

    Ok(())
}
