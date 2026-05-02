interface Transaction {
  name: string;
  amount: number;
  date: string;
  personal_finance_category?: {
    primary: string;
    detailed: string;
  } | null;
}

export interface MonthlyTrend {
  category: string;
  currentMonth: number;
  previousMonth: number;
  percentChange: number | null;
  increased: boolean;
}

export function calculateTrends(transactions: Transaction[]): {
  trends: MonthlyTrend[];
  hasEnoughData: boolean;
} {
  // monthKey is the YYYY-MM prefix of the transaction date
  const monthMap = new Map<string, Map<string, number>>();

  for (const txn of transactions) {
    const monthKey = txn.date.substring(0, 7);
    const category =
      txn.personal_finance_category?.primary || 'UNCATEGORIZED';

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, new Map());
    }
    const categoryMap = monthMap.get(monthKey)!;
    categoryMap.set(
      category,
      (categoryMap.get(category) || 0) + Math.abs(txn.amount)
    );
  }

  const months = Array.from(monthMap.keys()).sort().reverse();

  if (months.length < 2) {
    return { trends: [], hasEnoughData: false };
  }

  const currentMonthData = monthMap.get(months[0])!;
  const previousMonthData = monthMap.get(months[1])!;

  const allCategories = new Set([
    ...currentMonthData.keys(),
    ...previousMonthData.keys(),
  ]);

  const trends: MonthlyTrend[] = [];

  for (const category of allCategories) {
    const current =
      Math.round((currentMonthData.get(category) || 0) * 100) / 100;
    const previous =
      Math.round((previousMonthData.get(category) || 0) * 100) / 100;

    let percentChange: number | null = null;
    if (previous > 0) {
      percentChange = Math.round(
        ((current - previous) / previous) * 100
      );
    }

    trends.push({
      category,
      currentMonth: current,
      previousMonth: previous,
      percentChange,
      increased: percentChange !== null && percentChange > 20,
    });
  }

  trends.sort((a, b) => b.currentMonth - a.currentMonth);

  return { trends, hasEnoughData: true };
}
