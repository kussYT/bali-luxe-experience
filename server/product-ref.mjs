/** Shared short packing codes — keep in sync with src/lib/order-display.ts */

export function suggestProductCode(name) {
  const words = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && !/^(the|and|le|la|les|de|du|des|a|an|of|x)$/i.test(w));

  if (!words.length) return "REF";

  let code = words.map((w) => w[0].toUpperCase()).join("");
  if (code.length >= 3) return code.slice(0, 3);

  const first = words[0].toUpperCase();
  for (let i = 1; i < first.length && code.length < 3; i++) {
    code += first[i];
  }
  return code.slice(0, 3);
}

function sizeToken(variantTitle) {
  const raw = String(variantTitle || "").trim();
  if (!raw || /^default(\s+title)?$/i.test(raw)) return null;
  const m = raw.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|\d{2,3})\b/i);
  if (m) return m[1].toUpperCase();
  return raw.replace(/\s+/g, "").slice(0, 6).toUpperCase();
}

export function buildVariantSku(referenceCode, productName, variantTitle) {
  const base = String(referenceCode || "").trim().toUpperCase() || suggestProductCode(productName);
  const size = sizeToken(variantTitle);
  return size ? `${base}-${size}` : base;
}
