/* Check this page's peak/off-peak logic against the published vector table.
 *
 *   node test/check.mjs
 *
 * core.mjs is extracted verbatim from index.html by extract.mjs — run that
 * first if you have edited the page, so the thing under test is the thing
 * that ships. The vectors are downloaded, not vendored: a vendored copy can
 * drift from the published one without anything failing. */
import { phaseAt, nextChange } from "./core.mjs";

const VECTORS = "https://raw.githubusercontent.com/xyzs996/deepseek-peak-offpeak-vectors/main/deepseek-peak-offpeak-vectors.json";
const doc = await (await fetch(VECTORS)).json();

/* The vector table describes a schedule its own way; index.html reads the
 * shape that prices.json uses. Translate, so neither file has to bend. */
const asVendor = s => ({
  peak_windows_utc: s.peak_windows_utc.map(([a, b]) => `${a}-${b}`),
  weekend_off_peak_from_utc: s.weekend_offpeak_effective_utc,
  weekend_timezone: s.calendar_utc_offset_hours === 8 ? "Asia/Shanghai" : "UTC"
});

let bad = 0, n = 0;
for (const v of doc.vectors) {
  const got = phaseAt(new Date(v.at_utc), asVendor(doc.schedules[v.schedule]));
  n++;
  if (got !== v.expect) {
    bad++;
    console.log(`FAIL ${v.at_utc}  ${v.beijing_local}  expect ${v.expect}  got ${got}`);
  }
}
for (const b of doc.next_boundary_vectors) {
  const r = nextChange(new Date(b.from_utc), asVendor(doc.schedules[b.schedule]));
  const got = r ? r.at.toISOString().replace(".000Z", "Z") : "none";
  n++;
  if (got !== b.expect_next_change_utc || !r || r.phase !== b.expect_next_phase) {
    bad++;
    console.log(`FAIL boundary from ${b.from_utc}  expect ${b.expect_next_change_utc} ${b.expect_next_phase}  got ${got} ${r && r.phase}`);
  }
}
console.log(`${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
