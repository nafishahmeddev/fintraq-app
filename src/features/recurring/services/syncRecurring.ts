import { addDays, addMonths, addQuarters, addWeeks, addYears, isAfter, parseISO } from 'date-fns';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, RecurringEndCondition, RecurringFrequency, RecurringIntervalUnit, recurringTransactions } from '../../../db/schema';
import { NotificationService } from '../../../services/notification.service';
import { formatCurrency } from '../../../utils/format';

export function getNextRecurringDate(
  dateStr: string,
  frequency: RecurringFrequency,
  interval: number = 1,
  intervalUnit: RecurringIntervalUnit = 'DAYS'
): string {
  const date = parseISO(dateStr);
  let nextDate: Date;

  switch (frequency) {
    case 'DAILY':
      nextDate = addDays(date, 1);
      break;
    case 'WEEKLY':
      nextDate = addWeeks(date, 1);
      break;
    case 'BI_WEEKLY':
      nextDate = addWeeks(date, 2);
      break;
    case 'MONTHLY':
      nextDate = addMonths(date, 1);
      break;
    case 'QUARTERLY':
      nextDate = addQuarters(date, 1);
      break;
    case 'YEARLY':
      nextDate = addYears(date, 1);
      break;
    case 'CUSTOM':
      switch (intervalUnit) {
        case 'DAYS':
          nextDate = addDays(date, interval);
          break;
        case 'WEEKS':
          nextDate = addWeeks(date, interval);
          break;
        case 'MONTHS':
          nextDate = addMonths(date, interval);
          break;
        case 'YEARS':
          nextDate = addYears(date, interval);
          break;
        default:
          nextDate = addDays(date, interval);
      }
      break;
    default:
      nextDate = addDays(date, 1);
  }

  return nextDate.toISOString();
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
    const dueTemplates = await db.select({
      template: recurringTransactions,
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

    for (const { template, templateAccount } of dueTemplates) {
      await NotificationService.scheduleRecurringReminder(
        template.id,
        template.name,
        formatCurrency(template.amount, templateAccount?.currency || 'USD'),
        template.nextDate,
        template.reminderDays
      );
    }
  } catch (error) {
    console.error('[syncRecurringTransactions] Failed:', error);
  }
}
