// Shape of a transaction from the Plaid API
interface Transaction {
  name: string;
  amount: number;
  date: string;
  personal_finance_category?: {
    primary: string;
    detailed: string;
  } | null;
}

// Shape of the grouped output per category
export interface CategorySummary {
  category: string;
  total: number;
  transactions: Transaction[];
}

export function categorizeTransactions(
  transactions: Transaction[]
): CategorySummary[] {
  // Group transactions by their primary spending category
  const categoryMap = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    const category =
      txn.personal_finance_category?.primary || 'UNCATEGORIZED';
    const existing = categoryMap.get(category) || [];
    existing.push(txn);
    categoryMap.set(category, existing);
  }

  // Build summaries with absolute amounts and sort by highest spend
  const summaries: CategorySummary[] = [];

  for (const [category, txns] of categoryMap) {
    const total = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    summaries.push({ category, total, transactions: txns });
  }

  summaries.sort((a, b) => b.total - a.total);

  return summaries;
}