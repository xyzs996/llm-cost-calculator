/* Pull the pure clock functions out of index.html into test/core.mjs, so the
 * tests run against the shipped source rather than a copy someone forgot to
 * update. Deliberately dumb: it slices between two markers and fails loudly if
 * either moves. */
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf-8");
const js = html.split("<script>\n")[1]?.split("</script>")[0];
if (!js) throw new Error("no <script> block found in index.html");

const start = js.indexOf("function offsetHours");
const end = js.indexOf("/* ---- rates");
if (start < 0 || end < 0) throw new Error("clock section markers moved — fix extract.mjs");

const prelude = 'const hhmm = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };\n';
writeFileSync(new URL("core.mjs", import.meta.url),
  prelude + js.slice(start, end) + "\nexport { phaseAt, nextChange, offsetHours };\n");
console.log("core.mjs written from index.html");
