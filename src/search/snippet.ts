const DEFAULT_SNIPPET_LENGTH = 1_200;

export function extractSnippet(
  body: string,
  query: string,
  maxLength = DEFAULT_SNIPPET_LENGTH,
): string {
  if (body.length <= maxLength) return body;

  const terms = query.toLowerCase().match(/[\p{L}\p{N}_$-]{2,}/gu) ?? [];
  const lowerBody = body.toLowerCase();
  const firstMatch = terms
    .map((term) => lowerBody.indexOf(term))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, firstMatch - Math.floor(maxLength / 3));
  const end = Math.min(body.length, start + maxLength);

  return `${start > 0 ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`;
}
