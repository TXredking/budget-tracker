import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { getAccessToken, getCursor, setCursor } from '@/lib/store';
import { RemovedTransaction, Transaction } from 'plaid';

export async function GET() {
  const accessToken = getAccessToken();

  // Reject requests if no bank account is connected yet
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No access token. Connect a bank account first.' },
      { status: 400 }
    );
  }

  try {
    // Start from the last saved cursor position
    let cursor = getCursor();
    let added: Transaction[] = [];
    let modified: Transaction[] = [];
    let removed: RemovedTransaction[] = [];
    let hasMore = true;

    // Keep fetching pages until Plaid says there are no more
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: cursor || undefined,
      });

      const data = response.data;

      // Accumulate transactions from each page
      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    // Save cursor so the next sync only fetches new data
    setCursor(cursor!);

    return NextResponse.json({
      added,
      modified,
      removed,
      total: added.length,
    });
  } catch (error: unknown) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    );
  }
}