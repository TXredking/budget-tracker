'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess } from 'react-plaid-link';

interface PlaidLinkButtonProps {
  onConnected: () => void;
}

export default function PlaidLinkButton({ onConnected }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLinkToken() {
      const response = await fetch('/api/create-link-token', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to initialize bank connection');
        return;
      }
      setLinkToken(data.link_token);
    }
    fetchLinkToken();
  }, []);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken) => {
      const response = await fetch('/api/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to connect bank account');
        return;
      }
      onConnected();
    },
    [onConnected]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <>
      <button
        onClick={() => open()}
        disabled={!ready}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Connect Bank Account
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </>
  );
}
