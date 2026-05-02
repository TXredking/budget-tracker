import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const clientId = process.env.PLAID_CLIENT_ID;
const secret = process.env.PLAID_SECRET;
const env = process.env.PLAID_ENV ?? 'sandbox';

if (!clientId) throw new Error('Missing environment variable: PLAID_CLIENT_ID');
if (!secret) throw new Error('Missing environment variable: PLAID_SECRET');

const basePath = PlaidEnvironments[env as keyof typeof PlaidEnvironments];
if (!basePath) throw new Error(`Invalid PLAID_ENV: "${env}". Must be sandbox, development, or production.`);

const configuration = new Configuration({
  basePath,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': clientId,
      'PLAID-SECRET': secret,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
