/**
 * Reads an item code out of whatever a QR label contains: the numeric Item ID (a bare number or the
 * /scan/<id> link printed on the label) or the longer EQ- equipment code. Returns null for anything else.
 */
export function parseItemCode(text) {
  const value = String(text ?? '').trim();
  const eq = value.match(/EQ-[A-Z]+-\d{4,}/i);
  if (eq) return eq[0].toUpperCase();
  const link = value.match(/\/scan\/(\d{1,9})(?:[/?#]|$)/);
  if (link) return link[1];
  if (/^\d{1,9}$/.test(value)) return value;
  return null;
}
