use anchor_lang::prelude::*;
use crate::state::Vesting;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct UpdateCreationFee<'info> {
    #[account(
        mut,
        constraint = vesting.owner == owner.key() @ ErrorCode::CustomError
    )]
    pub vesting: Account<'info, Vesting>,
    pub owner: Signer<'info>,
}

pub fn update_creation_fee_handler(ctx: Context<UpdateCreationFee>, new_fee: u64) -> Result<()> {
    let vesting = &mut ctx.accounts.vesting;
    vesting.creation_fee = new_fee;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateTreasury<'info> {
    #[account(
        mut,
        constraint = vesting.owner == owner.key() @ ErrorCode::CustomError
    )]
    pub vesting: Account<'info, Vesting>,
    pub owner: Signer<'info>,
}

pub fn update_treasury_handler(ctx: Context<UpdateTreasury>, new_treasury: Pubkey) -> Result<()> {
    require!(new_treasury != Pubkey::default(), ErrorCode::ZeroAddress);
    let vesting = &mut ctx.accounts.vesting;
    vesting.treasury = new_treasury;
    Ok(())
}

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(
        mut,
        constraint = vesting.owner == owner.key() @ ErrorCode::CustomError
    )]
    pub vesting: Account<'info, Vesting>,
    pub owner: Signer<'info>,
}

pub fn transfer_ownership_handler(ctx: Context<TransferOwnership>, new_owner: Pubkey) -> Result<()> {
    require!(new_owner != Pubkey::default(), ErrorCode::ZeroAddress);
    let vesting = &mut ctx.accounts.vesting;
    vesting.owner = new_owner;
    Ok(())
}
