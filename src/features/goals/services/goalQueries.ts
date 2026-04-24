import { db } from '../../../db/client';
import { goals, payments } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';

export interface GoalProgress {
  goalId: number;
  name: string;
  target: number;
  current: number;
  remaining: number;
  percentage: number;
  status: string;
}

export async function getAllGoalsProgress(): Promise<GoalProgress[]> {
  const allGoals = await db.select().from(goals);
  
  // Calculate progress for each goal
  const progressPromises = allGoals.map(async (goal) => {
    // Sum CR (credits) - DR (debits) for this goal
    const result = await db.select({
      total: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE -${payments.amount} END)`
    })
    .from(payments)
    .where(eq(payments.goalId, goal.id));

    const current = result[0]?.total || 0;
    const target = goal.targetAmount;
    const remaining = Math.max(0, target - current);
    const percentage = target > 0 ? (current / target) * 100 : 0;

    return {
      goalId: goal.id,
      name: goal.name,
      target,
      current,
      remaining,
      percentage,
      status: goal.status
    };
  });

  return Promise.all(progressPromises);
}

export async function getGoalProgressById(id: number): Promise<GoalProgress | null> {
  const goalResults = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  const goal = goalResults[0];
  
  if (!goal) return null;

  const result = await db.select({
    total: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE -${payments.amount} END)`
  })
  .from(payments)
  .where(eq(payments.goalId, goal.id));

  const current = result[0]?.total || 0;
  const target = goal.targetAmount;
  const remaining = Math.max(0, target - current);
  const percentage = target > 0 ? (current / target) * 100 : 0;

  return {
    goalId: goal.id,
    name: goal.name,
    target,
    current,
    remaining,
    percentage,
    status: goal.status
  };
}
