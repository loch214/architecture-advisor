const MASK = "[redacted]";

const PATTERNS: RegExp[] = [
  // Emails
  /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu,
  // URLs that carry a query string or fragment (often tokens); plain URLs like "https://example.com" stay.
  /\bhttps?:\/\/[^\s?#]+[?#]\S*/gi,
  // Long key-like strings: 20+ letters/digits/_/- with at least one digit and one letter
  /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{20,}\b/g,
  // Phone numbers: 8+ digits, optionally with +, spaces, dots, dashes or brackets between them
  /(?<![\p{L}\p{N}])\+?\d(?:[\s.()-]*\d){7,}(?![\p{L}\p{N}])/gu,
];

/**
 * Light redaction before notes leave the server (AI_INTEGRATION §9.3): masks obvious emails, URLs with
 * query strings, phone numbers and key-like strings. Deterministic and cheap; not a guarantee, which is
 * why the form shows a privacy notice.
 */
export function redact(text: string): string {
  return PATTERNS.reduce((t, re) => t.replace(re, MASK), text);
}
