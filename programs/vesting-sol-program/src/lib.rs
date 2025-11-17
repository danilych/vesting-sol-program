use anchor_lang::prelude::*;

declare_id!("EXAhN7UrEffmdapcPtKodBg5FwcwYRLBQLTcBmKiCm4d");

#[program]
pub mod vesting_sol_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
