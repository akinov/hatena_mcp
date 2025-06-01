import { getOAuthHeaders } from '../hatenaAuth'; // Adjust path as necessary
import OAuth from 'oauth-1.0a';

// Mock the crypto module used by oauth-1.0a if necessary,
// though for basic header generation it might not be strictly needed
// if we are just checking the structure and presence of oauth parameters.

describe('Hatena OAuth Authentication', () => {
  const consumerKey = 'CjrFt8E/8G8otw=='; // Use the same key as in hatenaAuth.ts
  const consumerSecret = 'lhNFFK+sI/nei/yatXMxnObciI8='; // Use the same secret

  it('should generate OAuth headers correctly for a GET request', () => {
    const url = 'https://b.hatena.ne.jp/my/search/json?q=test';
    const method = 'GET';

    const headers = getOAuthHeaders(url, method);

    expect(headers).toHaveProperty('Authorization');
    const authHeader = headers.Authorization;

    expect(authHeader).toContain('OAuth oauth_consumer_key="' + encodeURIComponent(consumerKey) + '"');
    expect(authHeader).toContain('oauth_signature_method="HMAC-SHA1"');
    expect(authHeader).toContain('oauth_timestamp="');
    expect(authHeader).toContain('oauth_nonce="');
    expect(authHeader).toContain('oauth_version="1.0"');
    expect(authHeader).toContain('oauth_signature="');
  });

  it('should generate different nonces for different calls', () => {
    const url = 'https://b.hatena.ne.jp/my/search/json?q=test';
    const method = 'GET';

    const headers1 = getOAuthHeaders(url, method);
    const headers2 = getOAuthHeaders(url, method);

    const nonce1 = headers1.Authorization.match(/oauth_nonce="([^"]+)"/)?.[1];
    const nonce2 = headers2.Authorization.match(/oauth_nonce="([^"]+)"/)?.[1]

    expect(nonce1).toBeDefined();
    expect(nonce2).toBeDefined();
    expect(nonce1).not.toEqual(nonce2);
  });

  // It's hard to test the exact signature without re-implementing the signature logic.
  // We trust that oauth-1.0a library does this correctly.
  // The main test is that it includes all necessary OAuth parameters.
});
