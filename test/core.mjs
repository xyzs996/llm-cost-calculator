const hhmm = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
function offsetHours(vc) { return (vc.weekend_timezone || "Asia/Shanghai") === "Asia/Shanghai" ? 8 : 0; }

function phaseAt(when, vc) {
  if (!vc || !vc.peak_windows_utc) return null;
  const shifted = new Date(when.getTime() + offsetHours(vc) * 3600e3);
  const dow = shifted.getUTCDay();                       // 0 Sun … 6 Sat
  const effective = vc.weekend_off_peak_from_utc ? Date.parse(vc.weekend_off_peak_from_utc) : Infinity;
  if (when.getTime() >= effective && (dow === 0 || dow === 6)) return "offpeak";
  const mins = when.getUTCHours() * 60 + when.getUTCMinutes();
  for (const w of vc.peak_windows_utc) {
    const [s, e] = w.split("-");
    if (mins >= hhmm(s) && mins < hhmm(e)) return "peak";
  }
  return "offpeak";
}

/* Both sides of a weekend-interior window edge are off-peak, so a countdown
   that stops at the next edge reaches zero with nothing changing. Compare the
   phase either side of each candidate instead. */
function nextChange(when, vc) {
  const now = phaseAt(when, vc);
  const edges = new Set();
  for (const w of vc.peak_windows_utc) w.split("-").forEach(x => edges.add(hhmm(x)));
  edges.add(((24 - offsetHours(vc)) % 24) * 60);         // local midnight
  const sorted = [...edges].sort((a, b) => a - b);
  const day = Date.UTC(when.getUTCFullYear(), when.getUTCMonth(), when.getUTCDate());
  for (let ahead = 0; ahead < 10; ahead++) {
    for (const edge of sorted) {
      const c = new Date(day + ahead * 864e5 + edge * 60e3);
      if (c <= when) continue;
      if (phaseAt(c, vc) !== now) return { at: c, phase: phaseAt(c, vc) };
    }
  }
  return null;
}

function humanGap(ms) {
  const m = Math.round(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d >= 1) return d + "d " + (h % 24) + "h";
  if (h >= 1) return h + "h " + String(m % 60).padStart(2, "0") + "m";
  return m + "m";
}

function beijingClock(vc) {
  const s = new Date(Date.now() + offsetHours(vc) * 3600e3);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[s.getUTCDay()] + " " + String(s.getUTCHours()).padStart(2, "0") + ":" + String(s.getUTCMinutes()).padStart(2, "0");
}


export { phaseAt, nextChange, offsetHours };
