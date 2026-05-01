'use client';

import { useState } from 'react';
import PlaidLinkButton from '@/components/PlaidLinkButton';
import Dashboard from '@/components/Dashboard';
import { categorizeTransactions } from '@/lib/categorize';
import { compareToBudget, BudgetComparison } from '@/lib/budgets';
import TrendView from '@/components/TrendView';
import { calculateTrends, MonthlyTrend } from '@/lib/trends';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetComparison[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Store trend data for the month-over-month view
  const [trends, setTrends] = useState<{
    trends: MonthlyTrend[];
    hasEnoughData: boolean;
  } | null>(null);
  // Track which view is active
  const [view, setView] = useState<'budget' | 'trend'>('budget');

  async function handleSync() {
    setLoading(true);
    setError(null);

    try {
      // Fetch transactions from your API route
      const response = await fetch('/api/transactions');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sync transactions');
        return;
      }

      // Categorize transactions and compare to budget targets
      const categories = categorizeTransactions(data.added);
      const comparisons = compareToBudget(categories);
      setBudgetData(comparisons);
      // Calculate month-over-month trends from the same data
      const trendData = calculateTrends(data.added);
      setTrends(trendData);
    } catch (err) {
      setError('Failed to fetch transactions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Budget Tracker
        </h1>

        {/* State 1: No bank account connected yet */}
        {!isConnected ? (
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-12 shadow">
            <h2 className="text-xl font-semibold text-gray-700">
              Connect your bank account to get started
            </h2>
            <p className="text-gray-500 mb-4">
              Uses Plaid Sandbox with test data. No real bank data is accessed.
            </p>
            <PlaidLinkButton onConnected={() => setIsConnected(true)} />
          </div>
        ) : !budgetData ? (
          // State 2: Connected but transactions not synced yet
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-12 shadow">
            <h2 className="text-xl font-semibold text-gray-700">
              Bank account connected!
            </h2>
            <button
              onClick={handleSync}
              disabled={loading}
              className="rounded-lg bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Syncing...' : 'Sync Transactions'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
     ) : (
      <div>
        {/* Toggle buttons for switching views */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setView('budget')}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              view === 'budget'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Budget View
          </button>
          <button
            onClick={() => setView('trend')}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              view === 'trend'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Trend View
          </button>
        </div>

        {/* Render the active view */}
        {view === 'budget' ? (
          <Dashboard budgetData={budgetData} />
        ) : (
          trends && (
            <TrendView
              trends={trends.trends}
              hasEnoughData={trends.hasEnoughData}
            />
          )
        )}
      </div>
    )}
      </div>
    </main>
  );
}