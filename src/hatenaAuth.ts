import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// TODO: Store these securely, e.g., as environment variables
const CONSUMER_KEY = 'CjrFt8E/8G8otw==';
const CONSUMER_SECRET = 'lhNFFK+sI/nei/yatXMxnObciI8=';

const oauth = new OAuth({
  consumer: {
    key: CONSUMER_KEY,
    secret: CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  },
});

interface Token {
  key: string;
  secret: string;
}

/**
 * Generates OAuth 1.0a headers for a request.
 *
 * @param url The request URL.
 * @param method The HTTP method.
 * @param token Optional OAuth token.
 * @returns The OAuth headers object.
 */
export function getOAuthHeaders(
  url: string,
  method: string,
  token?: Token
): OAuth.Header {
  const oauthData = oauth.authorize({ url, method, data: {} }, token);
  return oauth.toHeader(oauthData);
}

// Placeholder for getting request and access tokens (OAuth 1.0a flow)
// Hatena's full-text search API might allow direct use of consumer key/secret
// without explicit user authorization token exchange.
// async function getRequestToken() { /* ... */ }
// async function getAccessToken(requestToken: Token, verifier: string) { /* ... */ }
