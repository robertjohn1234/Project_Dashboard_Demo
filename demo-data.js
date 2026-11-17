// Sample (made-up) project data for the portfolio demo.
// Everything is generated from today's date, so the demo always looks fresh. No real company data is used.

function iso(d) { return d.toISOString().slice(0, 10); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function r4(n) { return Math.round(n * 10000) / 10000; }
// small repeatable "random" so the numbers do not jump around between requests
function rnd(seed) { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }
const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };

// ---------- Cable status ----------
const WEEKS = 10;
const AREAS = [
  ["MV", "Substation A", 0.78], ["MV", "Substation B", 0.64], ["MV", "Pump House", 0.52],
  ["LV", "Zone1 - North", 0.71], ["LV", "Zone2 - South", 0.44], ["LV", "Zone3 - East", 0.58],
  ["ELV & Automation", "Control Room", 0.36], ["ELV & Automation", "Admin Building", 0.48], ["ELV & Automation", "Utility Area", 0.22]
];

function cableData() {
  const dates = [];
  for (let i = WEEKS - 1; i >= 0; i--) dates.push(iso(addDays(today(), -i * 4)));
  const areas = AREAS.map(([section, area, target], a) => {
    const progress = dates.map((_, w) => {
      const t = (w + 1) / WEEKS;
      const curve = t * t * (3 - 2 * t);                 // gentle S shape
      return r4(Math.min(1, Math.max(0, target * (0.15 + 0.85 * curve) + (rnd(a * 31 + w) - 0.5) * 0.01)));
    });
    for (let w = 1; w < progress.length; w++) progress[w] = Math.max(progress[w], progress[w - 1]);
    const latest = progress[progress.length - 1], previous = progress[progress.length - 2];
    return { section, area, progress, latest, previous, change: (latest - previous) * 100 };
  });
  const sections = [...new Set(areas.map(a => a.section))];
  const summary = sections.map(section => {
    const items = areas.filter(a => a.section === section);
    return { section, average: r4(items.reduce((s, a) => s + a.latest, 0) / items.length) };
  });
  return { title: "Cable Pulling & Termination", latestDate: dates[WEEKS - 1], previousDate: dates[WEEKS - 2], weeks: dates, areas, summary };
}

// ---------- S-curve ----------
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function scurveData() {
  const total = 26, latestIndex = 15;                     // 26-week plan, 16 weeks done
  const start = addDays(today(), -latestIndex * 7);
  const S = t => t * t * (3 - 2 * t);
  const weeks = [];
  let prevPlan = 0, prevBase1 = 0, prevAct = 0;
  for (let i = 0; i < total; i++) {
    const d = addDays(start, i * 7);
    const t = (i + 1) / total;
    const base1 = r4(S(Math.min(1, t * 0.92)));
    const plan = r4(S(t));
    const act = i <= latestIndex ? r4(Math.min(1, S(t) * (0.9 + 0.1 * (i / latestIndex)) + (rnd(i) - 0.4) * 0.01 + 0.012)) : null;
    const m = MONTHS[d.getMonth()];
    weeks.push({
      label: m.slice(0, 3) + " W" + (Math.floor((d.getDate() - 1) / 7) + 1),
      title: m + " " + d.getFullYear() + ", Week " + (Math.floor((d.getDate() - 1) / 7) + 1),
      month: m, year: d.getFullYear(), week: Math.floor((d.getDate() - 1) / 7) + 1,
      planWeekly: r4(plan - prevPlan), actualWeekly: act === null ? null : r4(act - prevAct),
      baseline1Cum: base1, baseline2Cum: plan, actualCum: act, planCum: plan,
      gapPP: act === null ? null : Math.round((plan - act) * 100000) / 1000
    });
    prevPlan = plan; prevBase1 = base1; if (act !== null) prevAct = act;
  }
  return { sheet: "Demo S-Curve", latestIndex, windowStart: 0, weeks };
}

// ---------- Daily activities ----------
const SUPERVISORS = {
  "Supervisor Alpha": [
    ["Pull MV cable, Substation A to Pump House", 0.85, "progress", "", ""],
    ["Terminate MV cable at Substation A panel", 1, "done", "", ""],
    ["Install cable tray, Zone1 north wall", 0.6, "progress", "", ""],
    ["Megger test, MV feeder 2", 0, "hold", "Waiting for test equipment calibration", "Waiting for test equipment calibration"],
    ["Label cables, Substation A", 1, "done", "", ""],
    ["Install lighting fixtures, walkway", 0.3, "progress", "", ""]
  ],
  "Supervisor Bravo": [
    ["Pull LV cable, Zone2 south", 0.4, "progress", "", ""],
    ["Terminate LV cable, Zone2 MCC", 0, "hold", "Material not yet delivered (lugs)", "Material not yet delivered (lugs)"],
    ["Install junction boxes, Zone2", 1, "done", "", ""],
    ["Cable trench cleanup, Zone2", 1, "done", "", ""],
    ["Install grounding grid, Zone2", 0.55, "progress", "", ""],
    ["Pull LV cable, Zone3 east", 0.2, "progress", "", ""]
  ],
  "Supervisor Charlie": [
    ["Install CCTV cabling, Admin Building", 0.7, "progress", "", ""],
    ["Terminate fiber, Control Room", 0.9, "progress", "", ""],
    ["Pull instrument cables, Utility Area", 0, "hold", "Area access blocked by crane work", "Area access blocked by crane work"],
    ["Install field instruments, Control Room", 0.45, "progress", "", ""],
    ["Label ELV cables, Admin Building", 1, "done", "", ""],
    ["Cable loop test, Control Room", 0, "pending", "Waiting for Alpha's termination", ""]
  ],
  "Supervisor Delta": [
    ["Install cable ladder, Pump House", 1, "done", "", ""],
    ["Pull power cable, Pump House", 0.65, "progress", "", ""],
    ["Terminate motor cables, Pump House", 0.25, "progress", "", ""],
    ["Fireproofing penetrations, Substation B", 0, "not-started", "", ""],
    ["Install earthing pits, Substation B", 0.8, "progress", "", ""]
  ]
};
const STATES = ["done", "progress", "hold", "pending", "not-started"];
function counts(items) { const c = { total: items.length }; STATES.forEach(s => c[s] = items.filter(i => i.state === s).length); return c; }
function avg(items) { const v = items.filter(i => i.percent !== null); return v.length ? r4(v.reduce((s, i) => s + i.percent, 0) / v.length) : null; }
function dailyData() {
  const supervisors = Object.entries(SUPERVISORS).map(([name, list]) => {
    const items = list.map(([action, percent, state, notes, reason]) => ({ action, assigned: name, percent, state, notes, reason }));
    return { name, ...counts(items), avgPercent: avg(items), items };
  });
  const all = supervisors.flatMap(s => s.items);
  return { sheet: "Demo Daily", reportDate: iso(today()), summary: { ...counts(all), avgPercent: avg(all) }, supervisors };
}
function dailyHistory() {
  const base = dailyData(), days = [];
  for (let i = 13; i >= 0; i--) {
    const k = (14 - i) / 14, done = Math.round(base.summary.done * (0.35 + 0.65 * k)), hold = Math.max(0, base.summary.hold + Math.round((rnd(i) - 0.5) * 3));
    const total = base.summary.total, progress = Math.max(0, Math.min(total - done - hold, base.summary.progress + Math.round((rnd(i + 40) - 0.5) * 4)));
    const pending = Math.max(0, total - done - hold - progress - base.summary["not-started"]);
    days.push({ date: iso(addDays(today(), -i)), total, done, progress, hold, pending, "not-started": base.summary["not-started"], avgPercent: r4(0.35 + 0.3 * k), supervisors: {} });
  }
  days[days.length - 1] = { date: iso(today()), ...base.summary, supervisors: {} };
  return { days };
}

// ---------- LV categories ----------
const ZONES = ["Zone1 - North", "Zone2 - South", "Zone3 - East"];
const CATS = [["Crane Cables", 40], ["Power Distribution Cabinets", 120], ["MCC Cables", 160], ["Switchgear Cables", 90], ["Power From Substation A", 30], ["Power To Substation B", 30]];
function catRows(week) {
  const rows = [];
  CATS.forEach(([category, base], c) => ZONES.forEach((zone, z) => {
    const target = Math.round(base * (0.7 + 0.15 * z) + c * 3);
    const k = Math.min(1, (week + 1) / 9 * (0.55 + 0.1 * ((c + z) % 4)) + 0.05);
    const laying = Math.round(target * Math.min(1, k)), termFrom = Math.round(laying * 0.7), termTo = Math.round(laying * 0.55);
    rows.push({ category, zone, target, laying, termFrom, termTo });
  }));
  return rows;
}
function categoryData() {
  const rows = catRows(8);
  return { date: iso(today()), weights: { laying: 0.8, termFrom: 0.1, termTo: 0.1 }, zones: ZONES, categories: CATS.map(c => c[0]), cables: rows.reduce((s, r) => s + r.target, 0), rows };
}
function categoryHistory() {
  const out = [];
  for (let w = 0; w < 9; w++) out.push({ date: iso(addDays(today(), -(8 - w) * 7)), rows: catRows(w) });
  return out;
}

module.exports = { cableData, scurveData, dailyData, dailyHistory, categoryData, categoryHistory };
