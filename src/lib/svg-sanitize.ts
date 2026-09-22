import "server-only";
import DOMPurify from "isomorphic-dompurify";

/**
 * Admin-supplied SVG (a schedule's room map) is otherwise-arbitrary markup
 * that ends up rendered raw (dangerouslySetInnerHTML) on public pages — an
 * unsanitized upload would be a stored-XSS hole (<script>, event handler
 * attributes like onload, external <image>/<use> references, etc). Strip
 * anything script-capable, keep everything an SVG drawing actually needs.
 */
export function sanitizeSvg(input: string): string {
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_ATTR: ["data-room"],
  }).trim();
}
