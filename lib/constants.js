export const HPL_LEVELS = ["Comments"];
export const STANDARD_LEVELS = ["Excellent", "Good", "Average", "Poor"];
export const PERFORMANCE_LEVELS = ["High Achieving", "Mid/High Achieving", "Mid/Low Achieving", "Under Achieving"];
export const PERFORMANCE_CATEGORY_IDS = ["Assessment", "Performance2"];

// Comments saved before the level rename still show under the new names
export const LEGACY_LEVEL_MAP = {
  Excellent: "High Achieving",
  Good: "Mid/High Achieving",
  Average: "Mid/Low Achieving",
  Poor: "Under Achieving",
  "High Achievement": "High Achieving",
  "Mid/High Achievement": "Mid/High Achieving",
  "Mid/Low Achievement": "Mid/Low Achieving",
  "Under Achievement": "Under Achieving",
};

export const PROGRESS_PERIODS = ["Progress 2", "Progress 3", "Progress 4"];
export const REPORT_PERIODS = [...PROGRESS_PERIODS, "Mocks"];

export const DEFAULT_DEPARTMENTS = [
  "Social Studies", "English", "Maths", "Science", 
  "Languages", "Arts", "PE", "Technology", "Primary", "Other"
];

// IDs are kept from the original categories so existing comment banks carry over
export const STANDARD_CATEGORIES = [
  { id: "HPL", label: "Attitude to Learning" },
  { id: "Homework", label: "Homework" },
  { id: "Assessment", label: "1. Performance based" },
  { id: "Performance2", label: "2. Performance based" },
  { id: "Improvement", label: "Development" },
];

export const REQUIRED_CATEGORY_IDS = ["Assessment", "Performance2", "Improvement"];

export const OPTIONAL_CATEGORIES = STANDARD_CATEGORIES.filter(c => !REQUIRED_CATEGORY_IDS.includes(c.id));

// Admin-standardised categories: comments are written on the admin page and pushed to every subject
export const ADMIN_SUBJECT_ID = "__admin__";
export const ADMIN_PASSWORD = "YCHK1932";
export const ADMIN_CATEGORY_IDS = ["HPL", "Homework"];
export const ADMIN_CATEGORIES = STANDARD_CATEGORIES.filter(c => ADMIN_CATEGORY_IDS.includes(c.id));

// Categories copied by "Share with Progress Report" (2. Performance based shares the Assessment bank)
export const PERIOD_SHARE_CATEGORY_IDS = ["HPL", "Homework", "Assessment", "Improvement"];

// Every category can have custom tabs
export function supportsTabs(categoryId) {
  return true;
}

// Only the tabs staff add themselves; there is no built-in "General" tab
export function getTabList(categoryId, customTabs = []) {
  return customTabs.filter(t => t !== "General");
}

// The admin (PLT) bank is not tied to a progress report; subjects get it in every progress report
export const ADMIN_PERIOD = "shared";

// Chinese department: 1. Reading and 2. Writing replace the two Performance based categories.
// They keep the same IDs (so the rest of the app works unchanged) but have separate comment banks,
// and staff pick up to 2 comments in each, which join into one bullet point.
const CHINESE_LABELS = { Assessment: "1. Reading", Performance2: "2. Writing" };
const CHINESE_SHORT_LABELS = { Assessment: "Reading", Performance2: "Writing" };
export const CHINESE_PICK_COUNT = 2;
export const CHINESE_MULTI_CATEGORY_IDS = ["Assessment", "Performance2"];

export function isChineseDept(dept) {
  return /chinese|中文|mandarin|putonghua/i.test(dept?.name || "");
}

export function isChineseSubject(subject, departments = []) {
  return isChineseDept(departments.find(d => d.id === subject?.department_id));
}

export function getCategories(chinese = false) {
  if (!chinese) return STANDARD_CATEGORIES;
  return STANDARD_CATEGORIES.map(c => CHINESE_LABELS[c.id] ? { ...c, label: CHINESE_LABELS[c.id] } : c);
}

export function getOptionalCategories(chinese = false) {
  return getCategories(chinese).filter(c => !REQUIRED_CATEGORY_IDS.includes(c.id));
}

// Categories offered by "Share with Progress Report" / "Share to subjects", with their labels
export function getShareOptions(chinese = false) {
  const ids = chinese
    ? ["HPL", "Homework", "Assessment", "Performance2", "Improvement"]
    : PERIOD_SHARE_CATEGORY_IDS;
  return ids.map(id => ({
    id,
    label: chinese && CHINESE_SHORT_LABELS[id]
      ? CHINESE_SHORT_LABELS[id]
      : id === "Assessment" ? "Performance based (1 & 2)" : getCategoryLabel(id),
  }));
}

// How many comments can be picked (and joined into one bullet) in a category
export function getPickCount(categoryId, chinese = false) {
  return chinese && CHINESE_MULTI_CATEGORY_IDS.includes(categoryId) ? CHINESE_PICK_COUNT : 1;
}

// Joins picked comments into one bullet point (no space after Chinese punctuation)
export function joinComments(parts) {
  return parts.reduce((out, t) => {
    if (!out) return t;
    return /[\u3000-\u303f\uff00-\uffef\u4e00-\u9fff]$/.test(out) ? out + t : `${out} ${t}`;
  }, "");
}

// 1. and 2. Performance based share one comment bank and one set of tabs (not for Chinese)
export function bankCategory(categoryId, chinese = false) {
  if (chinese) return categoryId;
  return categoryId === "Performance2" ? "Assessment" : categoryId;
}

export function getCategoryLabel(categoryId, chinese = false) {
  return getCategories(chinese).find(c => c.id === categoryId)?.label || categoryId;
}

// Determines whether a category's comments are shared across periods or period-specific
export function getCommentPeriod(categoryId) {
  if (categoryId === "Language") return "shared";
  return null; // means it uses the current report period
}

// Attitude to Learning and Homework use frequency levels
export const FREQUENCY_LEVELS = ["Always", "Regularly", "Sometimes", "Rarely"];
export const FREQUENCY_CATEGORY_IDS = ["HPL", "Homework"];

// Comments saved under the old achievement levels still show under the matching frequency level
const FREQUENCY_LEVEL_MAP = {
  "High Achieving": "Always",
  "Mid/High Achieving": "Regularly",
  "Mid/Low Achieving": "Sometimes",
  "Under Achieving": "Rarely",
};

export function getCategoryLevels(categoryId) {
  return FREQUENCY_CATEGORY_IDS.includes(categoryId) ? FREQUENCY_LEVELS : PERFORMANCE_LEVELS;
}

export function normaliseLevel(categoryId, level) {
  const mapped = LEGACY_LEVEL_MAP[level] || level;
  if (FREQUENCY_CATEGORY_IDS.includes(categoryId)) return FREQUENCY_LEVEL_MAP[mapped] || mapped;
  return mapped;
}

// Pastel colours for each level, highest to lowest (used on level buttons and in "View All")
export const LEVEL_COLOURS = [
  { bg: "#a5d6a7", border: "#5a9e5e", text: "#1b4d1f" }, // High / Always – pastel dark green
  { bg: "#dcf1d0", border: "#94c97f", text: "#2f5a1f" }, // Mid/High / Regularly – pastel light green
  { bg: "#fdf4b8", border: "#e0c74f", text: "#6b5300" }, // Mid/Low / Sometimes – pastel yellow
  { bg: "#fdd9b5", border: "#e89a55", text: "#7a3d00" }, // Under / Rarely – pastel orange
];

export function getLevelColour(categoryId, level) {
  const idx = getCategoryLevels(categoryId).indexOf(level);
  return idx >= 0 ? LEVEL_COLOURS[idx] : null;
}
