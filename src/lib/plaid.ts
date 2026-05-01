import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Configure the Plaid SDK with your Sandbox credentials
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

// Export a single Plaid client instance for all API routes to share
export const plaidClient = new PlaidApi(configuration);