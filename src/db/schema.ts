import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const ACCOUNT_TYPES = ['cash', 'card', 'savings', 'investment', 'loan', 'other'] as const;
export type AccountType = typeof ACCOUNT_TYPES[number];

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  holderName: text('holderName').notNull(),
  accountNumber: text('accountNumber'),
  type: text('type', { enum: ACCOUNT_TYPES }).notNull().default('cash'),
  icon: text('icon').notNull().default('wallet'),
  color: integer('color').notNull(),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  currency: text('currency').notNull().default('USD'),
  balance: real('balance').notNull().default(0),
  income: real('income').notNull().default(0),
  expense: real('expense').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  payments: many(payments),
}));

export const TRANSACTION_TYPES = ['CR', 'DR', 'TRANSFER'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type CategoryType = TransactionType;

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('grid'),
  color: integer('color').notNull(),
  type: text('type', { enum: TRANSACTION_TYPES }).notNull().default('DR'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  payments: many(payments),
}));

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  toAccountId: integer('to_account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  recurringId: integer('recurring_id').references(() => recurringTransactions.id, { onDelete: 'set null' }),
  budgetId: integer('budget_id').references(() => budgets.id, { onDelete: 'set null' }),
  goalId: integer('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  loanId: integer('loan_id').references(() => loans.id, { onDelete: 'set null' }),
  amount: real('amount').notNull(),
  type: text('type', { enum: TRANSACTION_TYPES }).notNull(),
  datetime: text('datetime').notNull(),
  note: text('note').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  accountIdIdx: index('payments_account_id_idx').on(table.accountId),
  toAccountIdIdx: index('payments_to_account_id_idx').on(table.toAccountId),
  categoryIdIdx: index('payments_category_id_idx').on(table.categoryId),
  goalIdIdx: index('payments_goal_id_idx').on(table.goalId),
  loanIdIdx: index('payments_loan_id_idx').on(table.loanId),
  datetimeIdx: index('payments_datetime_idx').on(table.datetime),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  account: one(accounts, {
    fields: [payments.accountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    fields: [payments.toAccountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [payments.categoryId],
    references: [categories.id],
  }),
  recurringTransaction: one(recurringTransactions, {
    fields: [payments.recurringId],
    references: [recurringTransactions.id],
  }),
  budget: one(budgets, {
    fields: [payments.budgetId],
    references: [budgets.id],
  }),
  goal: one(goals, {
    fields: [payments.goalId],
    references: [goals.id],
  }),
  loan: one(loans, {
    fields: [payments.loanId],
    references: [loans.id],
  }),
}));

export const RECURRING_FREQUENCIES = ['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'] as const;
export type RecurringFrequency = typeof RECURRING_FREQUENCIES[number];

export const RECURRING_INTERVAL_UNITS = ['DAYS', 'WEEKS', 'MONTHS', 'YEARS'] as const;
export type RecurringIntervalUnit = typeof RECURRING_INTERVAL_UNITS[number];

export const RECURRING_END_CONDITIONS = ['NEVER', 'AFTER_OCCURRENCES', 'ON_DATE'] as const;
export type RecurringEndCondition = typeof RECURRING_END_CONDITIONS[number];

export const recurringTransactions = sqliteTable('recurring_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['CR', 'DR'] }).notNull(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  note: text('note').notNull().default(''),
  icon: text('icon').notNull().default('sync'),
  color: integer('color').notNull(),
  frequency: text('frequency', { enum: RECURRING_FREQUENCIES }).notNull(),
  interval: integer('interval').notNull().default(1),
  intervalUnit: text('interval_unit', { enum: RECURRING_INTERVAL_UNITS }).notNull().default('DAYS'),
  startDate: text('start_date').notNull(),
  nextDate: text('next_date').notNull(),
  endCondition: text('end_condition', { enum: RECURRING_END_CONDITIONS }).notNull().default('NEVER'),
  endValue: text('end_value'),
  occurrencesCount: integer('occurrences_count').notNull().default(0),
  isPaused: integer('is_paused', { mode: 'boolean' }).notNull().default(false),
  reminderDays: integer('reminder_days').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const recurringTransactionsRelations = relations(recurringTransactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [recurringTransactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [recurringTransactions.categoryId],
    references: [categories.id],
  }),
  payments: many(payments),
}));

export const BUDGET_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const;
export type BudgetPeriod = typeof BUDGET_PERIODS[number];

export const BUDGET_MODES = ['AUTO', 'MANUAL'] as const;
export type BudgetMode = typeof BUDGET_MODES[number];

export const BUDGET_SCOPES = ['OVERALL', 'CATEGORY'] as const;
export type BudgetScope = typeof BUDGET_SCOPES[number];

export const BUDGET_TYPES = ['CR', 'DR'] as const;
export type BudgetType = typeof BUDGET_TYPES[number];

export const budgets = sqliteTable('budgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  type: text('type', { enum: BUDGET_TYPES }).notNull().default('DR'),
  color: integer('color').notNull().default(0),
  mode: text('mode', { enum: BUDGET_MODES }).notNull().default('AUTO'),
  scope: text('scope', { enum: BUDGET_SCOPES }).notNull().default('OVERALL'),
  period: text('period', { enum: BUDGET_PERIODS }).notNull().default('MONTHLY'),
  categoryIds: text('category_ids'),
  accountIds: text('account_ids'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  isRolling: integer('is_rolling', { mode: 'boolean' }).notNull().default(false),
  lastRolledDate: text('last_rolled_date'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const budgetsRelations = relations(budgets, ({ many }) => ({
  payments: many(payments),
}));

export const GOAL_STATUS = ['ACTIVE', 'REACHED', 'PAUSED'] as const;
export type GoalStatus = typeof GOAL_STATUS[number];

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  startDate: text('start_date'),
  endDate: text('end_date'),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  icon: text('icon').notNull().default('flag'),
  color: integer('color').notNull(),
  status: text('status', { enum: GOAL_STATUS }).notNull().default('ACTIVE'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const goalsRelations = relations(goals, ({ one, many }) => ({
  account: one(accounts, {
    fields: [goals.accountId],
    references: [accounts.id],
  }),
  payments: many(payments),
}));

export const LOAN_TYPES = ['LEND', 'BORROW'] as const;
export type LoanType = typeof LOAN_TYPES[number];

export const LOAN_STATUS = ['ACTIVE', 'PAID', 'OVERDUE'] as const;
export type LoanStatus = typeof LOAN_STATUS[number];

export const loans = sqliteTable('loans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  totalAmount: real('total_amount').notNull(),
  remainingAmount: real('remaining_amount').notNull(),
  type: text('type', { enum: LOAN_TYPES }).notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  icon: text('icon').notNull().default('cash'),
  color: integer('color').notNull(),
  status: text('status', { enum: LOAN_STATUS }).notNull().default('ACTIVE'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const loansRelations = relations(loans, ({ one, many }) => ({
  account: one(accounts, {
    fields: [loans.accountId],
    references: [accounts.id],
  }),
  payments: many(payments),
}));
