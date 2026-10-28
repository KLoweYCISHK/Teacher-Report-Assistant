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

// 1. and 2. Performance based share one comment bank and one set of tabs
export function bankCategory(categoryId) {
  return categoryId === "Performance2" ? "Assessment" : categoryId;
}

export function getCategoryLabel(categoryId) {
  return STANDARD_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
}

// Determines whether a category's comments are shared across periods or period-specific
export function getCommentPeriod(categoryId) {
  if (categoryId === "Language") return "shared";
  return null; // means it uses the current report period
}

export function getCategoryLevels(categoryId) {
  return PERFORMANCE_LEVELS;
}

export function normaliseLevel(categoryId, level) {
  return LEGACY_LEVEL_MAP[level] || level;
}
