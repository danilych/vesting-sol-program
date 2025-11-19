use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid start timestamp")]
    InvalidStartTimestamp,
    #[msg("Invalid end timestamp")]
    InvalidEndTimestamp,
    #[msg("Invalid periods configuration")]
    InvalidPeriodsConfiguration,
    #[msg("Zero address")]
    ZeroAddress,
}
