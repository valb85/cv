import sanitizeHtmlLib from 'sanitize-html';

/**
 * rich_text reaches the page through dangerouslySetInnerHTML, so it is
 * sanitised on write. An allowlist, not a blocklist: anything not named here
 * is dropped.
 */
export const sanitizeRichText = (html: string): string =>
  sanitizeHtmlLib(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'h2', 'h3', 'h4', 'a', 'span',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      span: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
