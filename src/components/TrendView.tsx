'use client';

import { MonthlyTrend } from '@/lib/trends';

interface TrendViewProps {
  trends: MonthlyTrend[];
  hasEnoughData: boolean;
}

// Convert FOOD_AND_DRINK to Food And Drink
function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TrendView({ trends, hasEnoughData }: TrendViewProps) {
  // Show a message when there's not enough data for comparison
  if (!hasEnoughData) {
    return (
      <div className="rounded-lg bg-white p-8 shadow text-center">
        <p className="text-gray-500">
          Trends will appear after more data accumulates. At least two months
          of transactions are needed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
              Category
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
              Previous Month
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
              Current Month
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
              Change
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {trends.map((trend) => (
            <tr
              key={trend.category}
              className={trend.increased ? 'bg-red-50' : ''}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {formatCategory(trend.category)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-500">
                ${trend.previousMonth.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-900">
                ${trend.currentMonth.toFixed(2)}
              </td>
              <td
                className={`px-4 py-3 text-right text-sm font-medium ${
                  trend.percentChange === null
                    ? 'text-gray-400'
                    : trend.increased
                      ? 'text-red-600'
                      : 'text-green-600'
                }`}
              >
                {trend.percentChange === null
                  ? 'New'
                  : `${trend.percentChange > 0 ? '+' : ''}${trend.percentChange}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}