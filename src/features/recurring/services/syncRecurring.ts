import { addDays, addMonths, addQuarters, addWeeks, addYears, isAfter, parseISO } from 'date-fns';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, RecurringEndCondition, RecurringFrequency, RecurringIntervalUnit, recurringTransactions } from '../../../db/schema';
import { NotificationService } from '../../../services/notification.service';
import { formatCurrency } from '../../../utils/format';

export function calculateNextOccurrenceDate(
  currentDateString: string,
  frequency: RecurringFrequency,
  interval: number = 1,
  intervalUnit: RecurringIntervalUnit = 'DAYS'
): string {
  const baseDate = parseISO(currentDateString);
  let calculatedNextDate: Date;

  switch (frequency) {
    case 'DAILY':
      calculatedNextDate = addDays(baseDate, 1);
      break;
    case 'WEEKLY':
      calculatedNextDate = addWeeks(baseDate, 1);
      break;
    case 'BI_WEEKLY':
      calculatedNextDate = addWeeks(baseDate, 2);
      break;
    case 'MONTHLY':
      calculatedNextDate = addMonths(baseDate, 1);
      break;
    case 'QUARTERLY':
      calculatedNextDate = addQuarters(baseDate, 1);
      break;
    case 'YEARLY':
      calculatedNextDate = addYears(baseDate, 1);
      break;
    case 'CUSTOM':
      switch (intervalUnit) {
        case 'DAYS':
          calculatedNextDate = addDays(baseDate, interval);
          break;
        case 'WEEKS':
          calculatedNextDate = addWeeks(baseDate, interval);
          break;
        case 'MONTHS':
          calculatedNextDate = addMonths(baseDate, interval);
          break;
        case 'YEARS':
          calculatedNextDate = addYears(baseDate, interval);
          break;
        default:
          calculatedNextDate = addDays(baseDate, interval);
      }
      break;
    default:
      calculatedNextDate = addDays(baseDate, 1);
  }

  return calculatedNextDate.toISOString();
}

export function hasMetEndCondition(
  endCondition: RecurringEndCondition,
  endValue: string | null,
  occurrencesCount: number,
  nextDateStr: string
): boolean {
  if (endCondition === 'NEVER') return false;

  if (endCondition === 'AFTER_OCCURRENCES') {
    const limit = parseInt(endValue || '0', 10);
    if (limit > 0 && occurrencesCount >= limit) {
      return true;
    }
  }

  if (endCondition === 'ON_DATE' && endValue) {
    const next = parseISO(nextDateStr);
    const end = parseISO(endValue);
    if (isAfter(next, end)) {
      return true;
    }
  }

  return false;
}

export async function syncRecurringTransactions() {
  const nowStr = new Date().toISOString();

  try {
    // Find all active recurring transactions that are due
    const pendingRecurringTransactions = await db.select({
      transactionTemplate: recurringTransactions,
      templateAccount: accounts,
    })
      .from(recurringTransactions)
      .leftJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
      .where(
        and(
          eq(recurringTransactions.isPaused, false),
          lte(recurringTransactions.nextDate, nowStr)
        )
      );

    for (const { transactionTemplate, templateAccount } of pendingRecurringTransactions) {
      await NotificationService.scheduleRecurringReminder(
        transactionTemplate.id,
        transactionTemplate.name,
        formatCurrency(transactionTemplate.amount, templateAccount?.currency || 'USD'),
        transactionTemplate.nextDate,
        transactionTemplate.reminderDays
      );
    }
  } catch (error) {
    console.error('[syncRecurringTransactions] Failed:', error);
  }
}
