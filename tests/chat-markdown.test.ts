import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERNAL_CHAT_ROUTES,
  isTechnicalRouteRequest,
  tokenizeInlineChatMarkdown,
} from '../src/lib/chat-markdown';

test('Phase 4.3: explicit internal markdown links resolve to trusted internal_link tokens', () => {
  for (const [href, expectedLabel] of Object.entries(INTERNAL_CHAT_ROUTES)) {
    const tokens = tokenizeInlineChatMarkdown(`Visit [${expectedLabel}](${href}) for details.`);
    const links = tokens.filter(t => t.type === 'internal_link');
    assert.equal(links.length, 1);
    assert.deepEqual(links[0], {
      type: 'internal_link',
      label: expectedLabel,
      href,
    });
  }
});

test('Phase 4.3: ordinary route mentions and parenthesized routes normalize cleanly without raw route parentheses', () => {
  const tokens = tokenizeInlineChatMarkdown(
    'Browse **Explore** (`/explore`), use Discover (/discover), sign in via Login (/auth), or open /lgu-dashboard and `/admin-dashboard`.'
  );
  const links = tokens.filter(t => t.type === 'internal_link');
  assert.deepEqual(links, [
    { type: 'internal_link', label: 'Explore', href: '/explore' },
    { type: 'internal_link', label: 'Discover', href: '/discover' },
    { type: 'internal_link', label: 'Login / Authentication', href: '/auth' },
    { type: 'internal_link', label: 'LGU Dashboard', href: '/lgu-dashboard' },
    { type: 'internal_link', label: 'Admin Dashboard', href: '/admin-dashboard' },
  ]);

  const plainText = tokens
    .filter(t => t.type === 'text')
    .map(t => t.value)
    .join('');
  assert.doesNotMatch(plainText, /\(\s*\/(?:explore|discover|auth|lgu-dashboard|admin-dashboard)/i);
});

test('Phase 4.3: technical route requests preserve raw route formatting', () => {
  assert.equal(isTechnicalRouteRequest('What are the routes and URLs for Explore and LGU Dashboard?'), true);
  assert.equal(isTechnicalRouteRequest('How do I use Explore?'), false);

  const tokens = tokenizeInlineChatMarkdown(
    'Use Explore (`/explore`) or `/lgu-dashboard` for implementation details.',
    { preserveTechnicalRoutes: true }
  );
  assert.equal(tokens.some(t => t.type === 'internal_link'), false);
  const codeTokens = tokens.filter(t => t.type === 'code').map(t => t.value);
  assert.deepEqual(codeTokens, ['/explore', '/lgu-dashboard']);
});

test('Phase 4.3: unsafe, external, and unrecognized URLs never become internal_link tokens', () => {
  const inputs = [
    'Check [External](https://evil.com/explore) for info.',
    'Click [XSS](javascript:alert(1)) now.',
    'Open [Data](data:text/html,<script>alert(1)</script>).',
    'Visit [Proto](//evil.com/auth).',
    'Go to [Unknown](/not-a-real-route).',
    'Plain external https://example.com/explore should stay text.',
  ];

  for (const input of inputs) {
    const tokens = tokenizeInlineChatMarkdown(input);
    assert.equal(
      tokens.some(t => t.type === 'internal_link'),
      false,
      `Expected no internal_link for input: ${input}`
    );
  }
});

test('Phase 4.3: markdown bold, italic, inline code, and escaped characters continue rendering safely', () => {
  const tokens = tokenizeInlineChatMarkdown('Use \\*\\*safe\\*\\* **bold**, *italic*, and `code` with [Explore](/explore).');
  assert.ok(tokens.some(t => t.type === 'bold' && t.value === 'bold'));
  assert.ok(tokens.some(t => t.type === 'italic' && t.value === 'italic'));
  assert.ok(tokens.some(t => t.type === 'code' && t.value === 'code'));
  assert.ok(tokens.some(t => t.type === 'internal_link' && t.label === 'Explore' && t.href === '/explore'));
});

test('Safe external Markdown links and images are tokenized while unsafe URLs and HTML remain plain text', () => {
  const safeTokens = tokenizeInlineChatMarkdown(
    'Read [Heritage Guide](https://example.com/guide) and see ![Basilica](https://example.com/basilica.jpg).'
  );
  assert.ok(
    safeTokens.some(
      t => t.type === 'external_link' && t.label === 'Heritage Guide' && t.href === 'https://example.com/guide'
    )
  );
  assert.ok(
    safeTokens.some(
      t => t.type === 'image' && t.alt === 'Basilica' && t.src === 'https://example.com/basilica.jpg'
    )
  );

  const unsafeTokens = tokenizeInlineChatMarkdown(
    'Bad ![XSS](javascript:alert(1)) and [Bad](data:text/html,<script>alert(1)</script>) and <img src=x onerror=alert(1)>.'
  );
  assert.equal(unsafeTokens.some(t => t.type === 'image' || t.type === 'external_link' || t.type === 'internal_link'), false);
});

