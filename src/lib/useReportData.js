import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc,
  getDocs, query, where, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { REPORT_PERIODS, PROGRESS_PERIODS, ADMIN_SUBJECT_ID, ADMIN_CATEGORY_IDS, ADMIN_PERIOD } from "@/lib/constants";

const COL = {
  departments: "departments",
  subjects: "subjects",
  comments: "comments",
  settings: "settings",
};

const toList = (snap) => snap.docs.map(d => ({ id: d.id, ...d.data() }));
const bySortOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
const byName = (a, b) => (a.name || "").localeCompare(b.name || "");

// Firestore batches allow 500 writes; stay under it.
const CHUNK = 450;

async function bulkCreate(colName, records) {
  const created = [];
  for (let i = 0; i < records.length; i += CHUNK) {
    const batch = writeBatch(db);
    records.slice(i, i + CHUNK).forEach(rec => {
      const ref = doc(collection(db, colName));
      batch.set(ref, rec);
      created.push({ id: ref.id, ...rec });
    });
    await batch.commit();
  }
  return created;
}

async function deleteRefs(refs) {
  for (let i = 0; i < refs.length; i += CHUNK) {
    const batch = writeBatch(db);
    refs.slice(i, i + CHUNK).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

async function deleteWhere(colName, filters) {
  const q = query(collection(db, colName), ...Object.entries(filters).map(([k, v]) => where(k, "==", v)));
  const snap = await getDocs(q);
  await deleteRefs(snap.docs.map(d => d.ref));
}

export function useReportData() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [comments, setComments] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);
  const [adminTabs, setAdminTabsState] = useState({});
  const [loaded, setLoaded] = useState({ d: false, s: false, c: false });

  // Live updates for everything (replaces Base44 list + subscribe)
  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, COL.departments), snap => {
        setDepartments(toList(snap).sort(bySortOrder));
        setLoaded(p => ({ ...p, d: true }));
      }),
      onSnapshot(collection(db, COL.subjects), snap => {
        setSubjects(toList(snap).sort(byName));
        setLoaded(p => ({ ...p, s: true }));
      }),
      onSnapshot(collection(db, COL.comments), snap => {
        setComments(toList(snap).sort(bySortOrder));
        setLoaded(p => ({ ...p, c: true }));
      }),
      onSnapshot(doc(db, COL.settings, "logo"), snap => {
        setLogoUrl(snap.exists() ? snap.data().value || null : null);
      }),
      onSnapshot(doc(db, COL.settings, "admin"), snap => {
        setAdminTabsState(snap.exists() ? snap.data().skill_tabs || {} : {});
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const loading = !(loaded.d && loaded.s && loaded.c);

  const addDepartment = async (name) => {
    const existing = departments.find(d => d.name === name);
    if (existing) return existing;
    const rec = { name, sort_order: departments.length };
    const ref = await addDoc(collection(db, COL.departments), rec);
    return { id: ref.id, ...rec };
  };

  const deleteDepartment = async (deptId) => {
    const subjectsInDept = subjects.filter(s => s.department_id === deptId);
    for (const subj of subjectsInDept) {
      await deleteWhere(COL.comments, { subject_id: subj.id });
      await deleteDoc(doc(db, COL.subjects, subj.id));
    }
    await deleteDoc(doc(db, COL.departments, deptId));
  };

  const addSubject = async (name, reportType, departmentId) => {
    const rec = {
      name,
      department_id: departmentId,
      report_type: reportType,
      mock_titles: ["", "", "", "", ""],
      skill_tabs: {},
    };
    const ref = await addDoc(collection(db, COL.subjects), rec);
    return { id: ref.id, ...rec };
  };

  const deleteSubject = async (subjectId) => {
    await deleteWhere(COL.comments, { subject_id: subjectId });
    await deleteDoc(doc(db, COL.subjects, subjectId));
  };

  const updateSubject = async (subjectId, data) => {
    await updateDoc(doc(db, COL.subjects, subjectId), data);
  };

  const addComment = async (subjectId, category, level, text, period, skillTab = "General") => {
    const rec = {
      subject_id: subjectId, category, level, text, period,
      skill_tab: skillTab, sort_order: comments.length,
    };
    const ref = await addDoc(collection(db, COL.comments), rec);
    return { id: ref.id, ...rec };
  };

  const bulkAddComments = async (subjectId, category, level, texts, period, skillTab = "General") => {
    const records = texts.map((text, i) => ({
      subject_id: subjectId, category, level, text, period,
      skill_tab: skillTab, sort_order: comments.length + i,
    }));
    return bulkCreate(COL.comments, records);
  };

  const editComment = async (commentId, newText) => {
    await updateDoc(doc(db, COL.comments, commentId), { text: newText });
  };

  const deleteComment = async (commentId) => {
    await deleteDoc(doc(db, COL.comments, commentId));
  };

  const getCommentsForSubject = useCallback((subjectId, category, level, period, skillTab = "General") => {
    return comments.filter(c =>
      c.subject_id === subjectId &&
      c.category === category &&
      c.level === level &&
      c.period === period &&
      (c.skill_tab || "General") === skillTab
    );
  }, [comments]);

  const deleteAllCommentsInCategory = async (subjectId, category, period) => {
    await deleteWhere(COL.comments, { subject_id: subjectId, category, period });
  };

  // Copy one or more categories (all report periods and tabs) from one subject to others.
  // Comments the target already has are skipped, so nothing is duplicated.
  const shareCommentsToSubjects = async (sourceSubjectId, categoryIds, targetSubjectIds) => {
    const cats = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    const sourceSubject = subjects.find(s => s.id === sourceSubjectId);
    const periods = [...REPORT_PERIODS, "shared"];

    for (const targetSubjectId of targetSubjectIds) {
      const records = [];
      for (const category of cats) {
        for (const period of periods) {
          const sourceComments = comments.filter(c =>
            c.subject_id === sourceSubjectId && c.category === category && c.period === period
          );
          const existingTargetComments = comments.filter(c =>
            c.subject_id === targetSubjectId && c.category === category && c.period === period
          );
          sourceComments
            .filter(sc => !existingTargetComments.some(ec =>
              ec.text === sc.text && ec.level === sc.level &&
              (ec.skill_tab || "General") === (sc.skill_tab || "General")))
            .forEach(sc => records.push({
              subject_id: targetSubjectId,
              category: sc.category,
              level: sc.level,
              text: sc.text,
              period: sc.period,
              skill_tab: sc.skill_tab || "General",
              sort_order: sc.sort_order ?? 0,
            }));
        }
      }
      if (records.length > 0) await bulkCreate(COL.comments, records);

      const targetSubject = subjects.find(s => s.id === targetSubjectId);
      const tabs = { ...(targetSubject?.skill_tabs || {}) };
      let tabsChanged = false;
      cats.forEach(category => {
        const sourceTabs = sourceSubject?.skill_tabs?.[category];
        if (!sourceTabs?.length) return;
        tabs[category] = Array.from(new Set([...(tabs[category] || []), ...sourceTabs])).filter(t => t !== "General");
        tabsChanged = true;
      });
      if (tabsChanged) await updateDoc(doc(db, COL.subjects, targetSubjectId), { skill_tabs: tabs });
    }
  };

  const sharePeriodComments = async (subjectId, category, sourcePeriod, targetPeriod) => {
    const sourceComments = comments.filter(c =>
      c.subject_id === subjectId && c.category === category && c.period === sourcePeriod
    );
    await deleteWhere(COL.comments, { subject_id: subjectId, category, period: targetPeriod });
    const commentsToCreate = sourceComments.map(sc => ({
      subject_id: subjectId,
      category: sc.category,
      level: sc.level,
      text: sc.text,
      period: targetPeriod,
      skill_tab: sc.skill_tab || "General",
      sort_order: 0,
    }));
    if (commentsToCreate.length > 0) await bulkCreate(COL.comments, commentsToCreate);
  };

  // PLT Generated comments: replace each target subject's Attitude to Learning and Homework
  // banks with the admin bank in every progress report, and mark the subject as using PLT comments.
  const applyPltComments = async (targetSubjectIds) => {
    const allComments = toList(await getDocs(collection(db, COL.comments)));
    const allSubjects = toList(await getDocs(collection(db, COL.subjects)));
    const seen = new Set();
    const source = allComments
      .filter(c => c.subject_id === ADMIN_SUBJECT_ID && ADMIN_CATEGORY_IDS.includes(c.category))
      .filter(c => {
        const key = [c.category, c.level, c.skill_tab || "General", c.text].join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    if (source.length === 0) throw new Error("NO_PLT_COMMENTS");

    const toDelete = allComments.filter(c =>
      targetSubjectIds.includes(c.subject_id) && ADMIN_CATEGORY_IDS.includes(c.category)
    );
    await deleteRefs(toDelete.map(c => doc(db, COL.comments, c.id)));

    const records = [];
    targetSubjectIds.forEach(subjectId => {
      PROGRESS_PERIODS.forEach(period => {
        source.forEach(c => records.push({
          subject_id: subjectId,
          category: c.category,
          level: c.level,
          text: c.text,
          period,
          skill_tab: c.skill_tab || "General",
          sort_order: c.sort_order ?? 0,
        }));
      });
    });
    await bulkCreate(COL.comments, records);

    for (const subjectId of targetSubjectIds) {
      const subj = allSubjects.find(s => s.id === subjectId);
      const skillTabs = { ...(subj?.skill_tabs || {}) };
      ADMIN_CATEGORY_IDS.forEach(cat => {
        if (adminTabs[cat]?.length) skillTabs[cat] = [...adminTabs[cat]];
        else delete skillTabs[cat];
      });
      await updateDoc(doc(db, COL.subjects, subjectId), { skill_tabs: skillTabs, atl_source: "plt" });
    }
  };

  // Older admin comments were saved per progress report. Merge them into one bank,
  // dropping duplicates, so the admin page no longer needs a progress report choice.
  const consolidateAdminComments = async () => {
    const admin = toList(await getDocs(collection(db, COL.comments)))
      .filter(c => c.subject_id === ADMIN_SUBJECT_ID);
    if (!admin.some(c => c.period !== ADMIN_PERIOD)) return;
    const order = { [ADMIN_PERIOD]: 0, "Progress 2": 1, "Progress 3": 2, "Progress 4": 3 };
    admin.sort((a, b) => (order[a.period] ?? 9) - (order[b.period] ?? 9));
    const seen = new Set();
    const toDelete = [];
    const toMove = [];
    admin.forEach(c => {
      const key = [c.category, c.level, c.skill_tab || "General", c.text].join("|");
      if (seen.has(key)) toDelete.push(c);
      else {
        seen.add(key);
        if (c.period !== ADMIN_PERIOD) toMove.push(c);
      }
    });
    await deleteRefs(toDelete.map(c => doc(db, COL.comments, c.id)));
    for (let i = 0; i < toMove.length; i += CHUNK) {
      const batch = writeBatch(db);
      toMove.slice(i, i + CHUNK).forEach(c => batch.update(doc(db, COL.comments, c.id), { period: ADMIN_PERIOD }));
      await batch.commit();
    }
  };

  // Custom tabs for the admin (PLT) bank
  const setAdminTabs = async (categoryId, tabs) => {
    await setDoc(doc(db, COL.settings, "admin"), {
      skill_tabs: { ...adminTabs, [categoryId]: tabs.filter(t => t !== "General") },
    }, { merge: true });
  };

  const setLogo = async (value) => {
    if (value) await setDoc(doc(db, COL.settings, "logo"), { key: "logo_url", value });
    else await deleteDoc(doc(db, COL.settings, "logo"));
  };

  return {
    departments,
    subjects,
    comments,
    logoUrl,
    loading,
    addDepartment,
    deleteDepartment,
    addSubject,
    deleteSubject,
    updateSubject,
    addComment,
    bulkAddComments,
    editComment,
    deleteComment,
    getCommentsForSubject,
    deleteAllCommentsInCategory,
    shareCommentsToSubjects,
    sharePeriodComments,
    applyPltComments,
    consolidateAdminComments,
    adminTabs,
    setAdminTabs,
    setLogo,
    reload: () => {}, // live updates make manual reloads unnecessary
  };
}
