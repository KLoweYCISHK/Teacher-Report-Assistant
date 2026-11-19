import { getCategoryLevels, getCategoryLabel } from "@/lib/constants";

// Which category each worksheet fills, guessed from the sheet name
const SHEET_MATCHERS = [
  { id: "Improvement", test: n => /develop|improv/.test(n) },
  { id: "Assessment", test: n => /perform|assess|achiev/.test(n) },
  { id: "HPL", test: n => /attitude|\batl\b|hpl/.test(n) },
  { id: "Homework", test: n => /homework/.test(n) },
];

export function categoryForSheet(sheetName) {
  const n = sheetName.toLowerCase();
  return SHEET_MATCHERS.find(m => m.test(n))?.id || null;
}

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

// Turns one sheet's rows into tabs and comments for a category:
//   column A = tab (a blank cell carries on the tab above; if column A is
//   empty from the start, comments go into a tab named after the category)
//   columns B onwards = the category's levels in order, one comment per cell
// Rows with the same tab name all go into the same tab.
export function readSheet(rows, categoryId) {
  const levels = getCategoryLevels(categoryId);
  const tabs = [];
  const comments = [];
  const seen = new Set();
  let tab = "";
  rows.forEach((row, i) => {
    const a = clean(row[0]);
    const b = clean(row[1]);
    // Skip the header row (e.g. "Categories | High Achieving | ..." or " | Always | Regularly | ...")
    if (i === 0 && (/categor|tab/i.test(a) || /achiev|always/i.test(b))) return;
    if (a) tab = a;
    if (!tab) tab = getCategoryLabel(categoryId);
    levels.forEach((level, idx) => {
      const text = clean(row[idx + 1]);
      if (!text) return;
      if (!tabs.includes(tab)) tabs.push(tab);
      const key = [tab, level, text].join("|");
      if (seen.has(key)) return;
      seen.add(key);
      comments.push({ skill_tab: tab, level, text });
    });
  });
  return { tabs, comments };
}

// Reads every sheet of the workbook with its raw rows and a guessed category
export async function readWorkbook(file) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  return workbook.SheetNames.map(sheetName => {
    const ws = workbook.Sheets[sheetName];
    // Always read from A1, so an empty column A doesn't shift the levels across
    const opts = { header: 1, defval: "" };
    if (ws["!ref"]) {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      range.s.c = 0;
      range.s.r = 0;
      opts.range = range;
    }
    return { sheetName, guess: categoryForSheet(sheetName), rows: XLSX.utils.sheet_to_json(ws, opts) };
  });
}
