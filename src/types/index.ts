/**
 * Core Type Definitions for Luno
 * Centralizing types ensures consistency across DB, API, and UI layers.
 */

/**
 * TransactionType: Represents the nature of a financial movement.
 * CR = Credit (Income / Inflow)
 * DR = Debit (Expense / Outflow)
 * TRANSFER = Transfer between accounts (no income/expense impact)
 */
export type TransactionType = 'CR' | 'DR' | 'TRANSFER';

/**
 * TrendMode: Dictates how a percentage change should be visually interpreted.
 */
export type TrendMode = 'high_is_good' | 'low_is_good' | 'neutral';


