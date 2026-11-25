import { getCategoryLevels, getCategoryLabel, normaliseLevel } from "@/lib/constants";

// Which category each worksheet fills, guessed from the sheet name
const SHEET_MATCHERS = [
  { id: "Improvement", test: n => /develop|improv/.test(n) },
  { id: "Assessment", test: n => /perform|assess|achiev/.test(n) },
  { id: "HPL", test: n => /attitude|\batl\b|hpl/.test(n) },
  { id: "Homework", test: n => /homework/.test(n) },
];

export function categoryForSheet(sheetName, chinese = false) {
  const n = sheetName.toLowerCase();
  if (chinese) {
    if (/reading|閱讀|阅读/.test(n)) return "Assessment";
    if (/writing|寫作|写作/.test(n)) return "Performance2";
  }
  return SHEET_MATCHERS.find(m => m.test(n))?.id || null;
}

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

// Turns one sheet's rows into tabs and comments for a category:
//   column A = tab (a blank cell carries on the tab above; if column A is
//   empty from the start, comments go into a tab named after the category)
//   columns B onwards = the category's levels in order, one comment per cell
// Rows with the same tab name all go into the same tab.
export function readSheet(rows, categoryId, label) {
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
    if (!tab) tab = label || getCategoryLabel(categoryId);
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

// Sheets written by the export, named so the import recognises them again
export function exportSheets(chinese = false) {
  const first = chinese
    ? [{ id: "Assessment", name: "Reading" }, { id: "Performance2", name: "Writing" }]
    : [{ id: "Assessment", name: "Performance based" }];
  return [...first,
    { id: "Improvement", name: "Development" },
    { id: "HPL", name: "ATL" },
    { id: "Homework", name: "Homework" }];
}

// Builds the rows for one category in the import format:
//   row 1 = "Categories" + the levels; column A = tab; columns B onwards = one comment per level
// Comments with no tab come first with column A left blank.
export function buildSheetRows(comments, categoryId, tabOrder = []) {
  const levels = getCategoryLevels(categoryId);
  const byTab = new Map();
  const seen = new Set();
  comments.forEach(c => {
    const tab = c.skill_tab && c.skill_tab !== "General" ? c.skill_tab : "";
    const level = normaliseLevel(categoryId, c.level);
    const idx = levels.indexOf(level);
    const text = clean(c.text);
    if (idx < 0 || !text) return;
    const key = [tab, level, text].join("|");
    if (seen.has(key)) return;
    seen.add(key);
    if (!byTab.has(tab)) byTab.set(tab, levels.map(() => []));
    byTab.get(tab)[idx].push(text);
  });

  const order = ["", ...tabOrder, ...byTab.keys()];
  const tabs = Array.from(new Set(order)).filter(t => byTab.has(t));
  const rows = [["Categories", ...levels]];
  tabs.forEach(tab => {
    const cols = byTab.get(tab);
    const height = Math.max(...cols.map(c => c.length));
    for (let r = 0; r < height; r++) rows.push([tab, ...cols.map(c => c[r] || "")]);
  });
  return rows.length > 1 ? rows : null;
}

// Downloads a subject's comment bank for one report period, in the same format as the import
export async function exportCommentBank({ subject, period, comments, chinese = false, bankCategory = id => id }) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  let count = 0;
  exportSheets(chinese).forEach(({ id, name }) => {
    const bank = bankCategory(id);
    const list = comments.filter(c =>
      c.subject_id === subject.id && c.category === bank && (c.period === period || c.period === "shared"));
    const rows = buildSheetRows(list, id, subject.skill_tabs?.[bank] || []);
    if (!rows) return;
    count += rows.length - 1;
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 32 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  if (count === 0) return false;
  const safe = s => String(s || "").replace(/[\\/:*?"<>|]+/g, "-").trim();
  XLSX.writeFile(wb, `${safe(subject.name)} - ${safe(period)} - Comment Bank.xlsx`);
  return true;
}
