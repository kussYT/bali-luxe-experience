const t = await (await fetch("https://bingindiaries.com/pages/find-us")).text();

// Find all occurrences of country-like headers in page HTML
const patterns = ["BALI", "FRANCE", "ITALY", "SPAIN", "PORTUGAL", "GREECE", "UK", "USA", "MEXICO", "AUSTRALIA", "CANGGU", "PARIS"];
for (const p of patterns) {
  let idx = 0;
  let count = 0;
  while ((idx = t.indexOf(p, idx)) !== -1 && count < 3) {
    console.log(p, ":", t.slice(idx, idx + 120).replace(/\s+/g, " "));
    idx++;
    count++;
  }
}

// Look for page content in shopify sections
const sections = [...t.matchAll(/shopify-section[^>]*>([\s\S]{0,3000}?)(?=shopify-section|$)/gi)];
for (const s of sections) {
  const text = s[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  if (text.includes("Canggu") || text.includes("STELLA") || text.includes("Samaritaine")) {
    console.log("\n=== SECTION ===\n", text.slice(0, 2000));
  }
}
