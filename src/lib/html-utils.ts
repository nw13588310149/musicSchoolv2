/** Strip HTML tags for search / preview (admin-only; not a security sanitizer). */
export function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isEmptyRichText(html: string) {
  return !stripHtml(html);
}
