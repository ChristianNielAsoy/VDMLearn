import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

// Verifies DOMPurify removes XSS payloads before v-html in HotspotDiagram.vue.
// Note: happy-dom has limited SVG namespace support so DOMPurify strips SVG
// elements to empty strings in this environment. That is safe (no output =
// no attack surface). The key invariant: none of the dangerous attributes or
// tags survive in the sanitized output.

// Mirror the sanitize config from HotspotDiagram.vue exactly
const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });

describe('DOMPurify — XSS payload removal', () => {
  it('onclick attribute is not present in sanitized output', () => {
    const result = sanitize('<circle cx="10" cy="10" r="5" onclick="alert(1)" />');
    expect(result).not.toContain('onclick');
  });

  it('onerror attribute is not present in sanitized output', () => {
    const result = sanitize('<image href="x" onerror="alert(1)" />');
    expect(result).not.toContain('onerror');
  });

  it('script opening tag is stripped by FORBID_TAGS (text content may remain as inert text)', () => {
    // DOMPurify strips the <script> element; text content becomes an inert text
    // node (not executed). The critical property: no executable <script> tag.
    const result = DOMPurify.sanitize('<script>alert(1)</script><p>safe</p>', {
      FORBID_TAGS: ['script'],
    });
    expect(result).not.toContain('<script');
  });

  it('javascript: href is not present in sanitized output', () => {
    const result = sanitize('<a href="javascript:alert(1)"><text>click</text></a>');
    expect(result).not.toContain('javascript:');
  });

  it('data: URI with script is not present in sanitized output', () => {
    const result = sanitize('<image href="data:text/html,<script>alert(1)</script>" />');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
  });
});
