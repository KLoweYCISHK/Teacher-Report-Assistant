export const HPL_LEVELS = ["Comments"];
export const STANDARD_LEVELS = ["Excellent", "Good", "Average", "Poor"];
export const PERFORMANCE_LEVELS = ["High Achievement", "Mid/High Achievement", "Mid/Low Achievement", "Under Achievement"];
export const PERFORMANCE_CATEGORY_IDS = ["Assessment", "Performance2"];

// Comments saved before the level rename still show under the new names
export const LEGACY_LEVEL_MAP = {
  Excellent: "High Achievement",
  Good: "Mid/High Achievement",
  Average: "Mid/Low Achievement",
  Poor: "Under Achievement",
};

export const LEVEL_DESCRIPTORS = {
  "High Achievement": ["Critically evaluates", "Demonstrates mastery", "Exhibits exceptional insight"],
  "Mid/High Achievement": ["Effectively evaluates", "Consistently applies", "Demonstrates strong competence"],
  "Mid/Low Achievement": ["Shows developing competence", "Regularly contributes", "Shows a sound understanding"],
  "Under Achievement": ["Is beginning to identify", "Requires structured guidance", "Requires support to describe"],
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

// 1. and 2. Performance based share one comment bank and one set of tabs
export function bankCategory(categoryId) {
  return categoryId === "Performance2" ? "Assessment" : categoryId;
}

export function getCategoryLabel(categoryId) {
  return STANDARD_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
}

// Determines whether a category's comments are shared across periods or period-specific
export function getCommentPeriod(categoryId) {
  if (categoryId === "HPL" || categoryId === "Language") return "shared";
  return null; // means it uses the current report period
}

export function getCategoryLevels(categoryId) {
  return PERFORMANCE_LEVELS;
}

export function normaliseLevel(categoryId, level) {
  return LEGACY_LEVEL_MAP[level] || level;
}
