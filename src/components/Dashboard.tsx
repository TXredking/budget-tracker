'use client';

import { BudgetComparison } from '@/lib/budgets';

interface DashboardProps {
  budgetData: BudgetComparison[];
}

// Convert SCREAMING_SNAKE_CASE category names to Title Case
function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Return a Tailwind color class based on budget usage
function getBarColor(percentUsed: number): string {
  if (percentUsed > 100) return 'bg-red-500';
  if (percentUsed >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function Dashboard({ budgetData }: DashboardProps) {
  // Calculate totals across all categories
  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0);
  const totalBudget = budgetData.reduce((sum, item) => sum + item.budget, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      {/* Summary cards showing overall budget status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalBudget.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Remaining</p>
          <p
            className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            ${totalRemaining.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Per-category progress bars */}
      <div className="space-y-4">
        {budgetData.map((item) => (
          <div key={item.category} className="rounded-lg bg-white p-4 shadow">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-gray-900">
                {formatCategory(item.category)}
              </span>
              <span className="text-sm text-gray-500">
                ${item.spent.toFixed(2)} / ${item.budget.toFixed(2)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className={`h-3 rounded-full ${getBarColor(item.percentUsed)} transition-all`}
                style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {item.percentUsed}% of budget used
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}