// In-memory store for demo purposes. In production, use a database.
let accessToken: string | null = null;
let cursor: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getCursor() {
  return cursor;
}

export function setCursor(newCursor: string) {
  cursor = newCursor;
}