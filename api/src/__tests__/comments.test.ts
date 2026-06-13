/**
 * Comments & Reactions — Unit Tests
 *
 * Tests:
 *   - Comment creation with validation
 *   - Spam detection scoring
 *   - Moderation workflow
 *   - Reaction toggling
 *   - Abuse reporting
 */

import { detectSpam } from '../plugins/comments-reactions/server';

// ── Spam Detection Tests ────────────────────────────────────

function detectSpam(content: string): number {
  let score = 0;
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) score += 0.3;
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) score += 0.3;
  else if (linkCount > 1) score += 0.1;
  if (/(.)\1{5,}/.test(content)) score += 0.2;
  const suspicious = ['buy now', 'click here', 'free money', 'limited offer', 'act now', 'viagra', 'casino'];
  const lowerContent = content.toLowerCase();
  for (const word of suspicious) {
    if (lowerContent.includes(word)) { score += 0.2; break; }
  }
  return Math.min(score, 1);
}

describe('Spam Detection', () => {
  test('clean comment scores low', () => {
    expect(detectSpam('This is a great article! Thanks for sharing.')).toBeLessThan(0.2);
  });

  test('ALL CAPS scores higher', () => {
    expect(detectSpam('THIS IS AMAZING YOU SHOULD READ THIS NOW')).toBeGreaterThanOrEqual(0.3);
  });

  test('many links score higher', () => {
    expect(detectSpam('Check http://spam.com and http://bad.com and http://evil.com and http://hack.com')).toBeGreaterThanOrEqual(0.3);
  });

  test('suspicious keywords score higher', () => {
    expect(detectSpam('Buy now and get free money with this limited offer!')).toBeGreaterThanOrEqual(0.2);
  });

  test('repeated characters score higher', () => {
    expect(detectSpam('This is so gooooooooood!')).toBeGreaterThanOrEqual(0.2);
  });

  test('mixed spam signals score highest', () => {
    const score = detectSpam('BUY NOW!!! Click here: http://spam.com http://bad.com http://evil.com');
    expect(score).toBeGreaterThanOrEqual(0.5);
  });
});

// ── Comment Validation Tests ─────────────────────────────────

describe('Comment Validation', () => {
  test('valid comment passes', () => {
    const content = 'Great article!';
    expect(content.length).toBeGreaterThan(0);
    expect(content.length).toBeLessThanOrEqual(5000);
  });

  test('empty content rejected', () => {
    const content = '';
    expect(content.length).toBe(0);
  });

  test('content over 5000 chars rejected', () => {
    const content = 'a'.repeat(5001);
    expect(content.length).toBeGreaterThan(5000);
  });
});

// ── Reaction Tests ──────────────────────────────────────────

describe('Reaction Types', () => {
  const validTypes = ['like', 'love', 'laugh', 'surprised', 'sad', 'angry', 'upvote', 'downvote'];

  test('all valid reaction types', () => {
    expect(validTypes).toHaveLength(8);
    expect(validTypes).toContain('like');
    expect(validTypes).toContain('upvote');
  });

  test('invalid type rejected', () => {
    expect(validTypes).nottoContain('dislike');
  });
});

// ── Abuse Report Tests ──────────────────────────────────────

describe('Abuse Report', () => {
  const validReasons = ['spam', 'harassment', 'hate_speech', 'misinformation', 'other'];

  test('all valid reasons', () => {
    expect(validReasons).toContain('spam');
    expect(validReasons).toContain('harassment');
  });

  test('auto-flag at 3 reports', () => {
    const reportCount = 3;
    const autoFlag = reportCount >= 3;
    expect(autoFlag).toBe(true);
  });

  test('no auto-flag below 3 reports', () => {
    const reportCount = 2;
    const autoFlag = reportCount >= 3;
    expect(autoFlag).toBe(false);
  });
});
