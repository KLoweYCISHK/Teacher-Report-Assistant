export const HPL_LEVELS = ["Comments"];
export const STANDARD_LEVELS = ["Excellent", "Good", "Average", "Poor"];

export const PROGRESS_PERIODS = ["Progress 2", "Progress 3", "Progress 4"];
export const REPORT_PERIODS = [...PROGRESS_PERIODS, "Mocks"];

export const DEFAULT_DEPARTMENTS = [
  "Social Studies", "English", "Maths", "Science", 
  "Languages", "Arts", "PE", "Technology", "Primary", "Other"
];

export const STANDARD_CATEGORIES = [
  { id: "HPL", label: "Approaches to Learning" },
  { id: "Language", label: "Language" },
  { id: "Assessment", label: "Assessment" },
  { id: "Homework", label: "Homework" },
  { id: "Improvement", label: "Improvement" },
];

export const OPTIONAL_CATEGORIES = [
  { id: "HPL", label: "Approaches to Learning" },
  { id: "Language", label: "Language" },
  { id: "Homework", label: "Homework" },
];

// Determines whether a category's comments are shared across periods or period-specific
export function getCommentPeriod(categoryId) {
  if (categoryId === "HPL" || categoryId === "Language") return "shared";
  return null; // means it uses the current report period
}

export function getCategoryLevels(categoryId) {
  return categoryId === "HPL" ? HPL_LEVELS : STANDARD_LEVELS;
}
