import { CategorySummary } from './categorize';

// Monthly spending limits per category
const MONTHLY_BUDGETS: Record<string, number> = {
  FOOD_AND_DRINK: 500,
  TRANSPORTATION: 200,
  ENTERTAINMENT: 100,
  GENERAL_MERCHANDISE: 300,
  RENT_AND_UTILITIES: 1500,
  TRAVEL: 400,
  PERSONAL_CARE: 100,
  GENERAL_SERVICES: 200,
};

// Fallback budget for categories not listed above
const DEFAULT_BUDGET = 250;

export interface BudgetComparison {
  category: string;
  spent: number;
  budget: number;
  remaining: number;
  percentUsed: number;
}

export function compareToBudget(
  categories: CategorySummary[]
): BudgetComparison[] {
  return categories.map(({ category, total }) => {
    // Look up the budget for this category, or use the default
    const budget = MONTHLY_BUDGETS[category] || DEFAULT_BUDGET;
    const remaining = budget - total;
    const percentUsed = Math.round((total / budget) * 100);

    return {
      category,
      spent: Math.round(total * 100) / 100,
      budget,
      remaining: Math.round(remaining * 100) / 100,
      percentUsed,
    };
  });
}