interface Transaction {
  name: string;
  amount: number;
  date: string;
  personal_finance_category?: {
    primary: string;
    detailed: string;
  } | null;
}

export interface CategorySummary {
  category: string;
  total: number;
  transactions: Transaction[];
}

export function categorizeTransactions(
  transactions: Transaction[]
): CategorySummary[] {
  const categoryMap = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    const category =
      txn.personal_finance_category?.primary || 'UNCATEGORIZED';
    const existing = categoryMap.get(category) || [];
    existing.push(txn);
    categoryMap.set(category, existing);
  }

  const summaries: CategorySummary[] = [];

  for (const [category, txns] of categoryMap) {
    const total = txns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    summaries.push({ category, total, transactions: txns });
  }

  summaries.sort((a, b) => b.total - a.total);

  return summaries;
}
