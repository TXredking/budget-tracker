'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess } from 'react-plaid-link';

interface PlaidLinkButtonProps {
  onConnected: () => void;
}

export default function PlaidLinkButton({ onConnected }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Fetch a link token from our API route when the component mounts
  useEffect(() => {
    async function fetchLinkToken() {
      const response = await fetch('/api/create-link-token', {
        method: 'POST',
      });
      const data = await response.json();
      setLinkToken(data.link_token);
    }
    fetchLinkToken();
  }, []);

  // When Plaid Link succeeds, send the public_token to our exchange endpoint
  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken) => {
      await fetch('/api/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });
      onConnected();
    },
    [onConnected]
  );

  // Initialize the Plaid Link hook with our token and success handler
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Connect Bank Account
    </button>
  );
}