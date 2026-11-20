// Reads a ManageBac "Term Grades" export into a class list.
// Columns are found by their heading; if a heading is missing the usual
// ManageBac column is used instead:
//   C Last Name · D First Name · E Other Name · F Preferred Name
//   H Final Grade · L–O ATL: Self-regulation, Collaboration, Responsibility, Attitude
// Nothing here is saved — it stays in the browser like typed names.

export const ATL_FIELDS = [
  { key: "selfRegulation", label: "Self-regulation", short: "Self-reg", heading: /self.?regulation/, col: 11 },
  { key: "collaboration", label: "Collaboration", short: "Collab", heading: /collaboration/, col: 12 },
  { key: "responsibility", label: "Responsibility", short: "Resp", heading: /responsibility/, col: 13 },
  { key: "attitude", label: "Attitude", short: "Attitude", heading: /attitude/, col: 14 },
];

const COLUMNS = {
  last: { heading: /^last name$/, col: 2 },
  first: { heading: /^first name$/, col: 3 },
  other: { heading: /^other name$/, col: 4 },
  preferred: { heading: /^preferred name$/, col: 5 },
  grade: { heading: /^final grade$/, col: 7 },
};

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
const value = (v) => {
  const t = clean(v);
  return !t || /^n\/?a$/i.test(t) || t === "-" ? null : t;
};

export async function readClassList(file) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  // Prefer the "Term Grades" sheet, otherwise the first sheet
  const sheetName = workbook.SheetNames.find(n => /term grades/i.test(n)) || workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];
  const opts = { header: 1, defval: "" };
  if (ws["!ref"]) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    range.s.c = 0;
    range.s.r = 0;
    opts.range = range;
  }
  const rows = XLSX.utils.sheet_to_json(ws, opts);

  // The heading row is the one containing "Last Name"
  const headerIdx = rows.findIndex(r => r.some(c => /^last name$/i.test(clean(c))));
  const headings = headerIdx >= 0 ? rows[headerIdx].map(c => clean(c).toLowerCase()) : [];
  const colFor = ({ heading, col }) => {
    const i = headings.findIndex(h => heading.test(h));
    return i >= 0 ? i : col;
  };
  const cols = Object.fromEntries(Object.entries(COLUMNS).map(([k, c]) => [k, colFor(c)]));
  const atlCols = ATL_FIELDS.map(f => ({ ...f, idx: colFor({ heading: new RegExp("atl.*" + f.heading.source), col: f.col }) }));

  const students = [];
  const used = new Set();
  rows.slice(headerIdx + 1).forEach(r => {
    const last = clean(r[cols.last]);
    const first = clean(r[cols.first]);
    if (!last && !first) return;
    const other = clean(r[cols.other]);
    const preferred = clean(r[cols.preferred]);
    const alias = preferred && preferred !== first ? preferred : other && other !== first ? other : "";
    let name = [alias ? `${first} (${alias})` : first, last].filter(Boolean).join(" ");
    // Names must be unique for the report steps
    let n = 2;
    const base = name;
    while (used.has(name)) name = `${base} ${n++}`;
    used.add(name);

    const atl = Object.fromEntries(atlCols.map(f => [f.key, value(r[f.idx])]));
    students.push({ name, grade: value(r[cols.grade]), atl });
  });
  return students;
}
