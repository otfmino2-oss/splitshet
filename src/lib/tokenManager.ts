/**
 * Token refresh queue to prevent race conditions
 * Ensures only one token refresh happens at a time
 */

let refreshPromise: Promise<string | null> | null = null;

export async function getValidAccessToken(
  getAuthToken: () => string | null,
  getRefreshToken: () => string | null,
  refreshAccessToken: () => Promise<string | null>
): Promise<string | null> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    try {
      return await refreshPromise;
    } catch {
      return null;
    }
  }

  // Check if current token is still valid
  const currentToken = getAuthToken();
  if (currentToken) {
    return currentToken;
  }

  // Start refresh
  refreshPromise = (async () => {
    try {
      const newToken = await refreshAccessToken();
      return newToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Reset refresh promise (useful for testing or logout)
 */
export function resetRefreshPromise(): void {
  refreshPromise = null;
}
