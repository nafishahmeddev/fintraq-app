import { Platform } from 'react-native';
import { IoniconName } from '@/src/utils/icons';

export interface ProFeature {
  icon: IoniconName;
  title: string;
  description: string;
  freeLimit?: string;
}

export const SKU_LIFETIME = Platform.select({
  ios: 'com.luno.lifetime',
  android: 'luno_lifetime',
}) || 'luno_lifetime';

export const ALL_SKUS = [SKU_LIFETIME];

export const FREE_LIMITS = {
  ACCOUNTS: 5,
  CATEGORIES: 10,
  BUDGETS: 1,
  RECURRING: 3,
  GOALS: 2,
  LOANS: 2,
  PEOPLE: 5,
  PLACES: 5,
} as const;

export const FEATURES: ProFeature[] = [
  { icon: 'wallet-outline', title: 'Unlimited Accounts', description: 'Track every card, wallet, and savings account without restriction.', freeLimit: `${FREE_LIMITS.ACCOUNTS} accounts` },
  { icon: 'grid-outline', title: 'Unlimited Categories', description: 'Build a complete budget taxonomy with as many categories as you need.', freeLimit: `${FREE_LIMITS.CATEGORIES} categories` },
  { icon: 'pie-chart-outline', title: 'Unlimited Budgets', description: 'Set daily, weekly, monthly, or custom-range spending limits for every area.', freeLimit: `${FREE_LIMITS.BUDGETS} budget` },
  { icon: 'repeat-outline', title: 'Unlimited Recurring', description: 'Automate every bill, salary, and subscription with recurring transactions.', freeLimit: `${FREE_LIMITS.RECURRING} recurring` },
  { icon: 'flag-outline', title: 'Unlimited Goals & Loans', description: 'Track every savings milestone and debt repayment without limits.', freeLimit: `${FREE_LIMITS.GOALS} each` },
  { icon: 'analytics-outline', title: 'Full Analytics', description: 'Unlock 30-day, 90-day, and all-time windows with period-over-period comparison.', freeLimit: '7 days only' },
  { icon: 'search-outline', title: 'Global Search', description: 'Instantly surface any transaction, account, or category across your history.' },
  { icon: 'options-outline', title: 'Advanced Filters', description: 'Multi-select filters by account, category, date range, amount, and sort order.' },
  { icon: 'people-outline', title: 'People & Places', description: 'Associate transactions with contacts and locations for deeper context.', freeLimit: `${FREE_LIMITS.PEOPLE} each` },
];
