// Saved class progress — kept ONLY in this browser (localStorage).
// Student names, grades and chosen comments never go to Firebase.

const KEY = "tra_savedClasses";

export function loadSavedClasses() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}");
    return Object.values(all).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return [];
  }
}

export function saveClass(entry) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}");
    all[entry.id] = { ...entry, updatedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function deleteSavedClass(id) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}");
    delete all[id];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function newClassId() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// How many students have every category filled in
export function countCompleted(entry) {
  const cats = entry.categories || [];
  return (entry.students || []).filter(s =>
    cats.every(c => (entry.classData?.[s]?.[c.id] || "").trim().length > 0)
  ).length;
}
