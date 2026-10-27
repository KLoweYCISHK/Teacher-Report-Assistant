import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc,
  getDocs, query, where, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROGRESS_PERIODS } from "@/lib/constants";

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

  const shareCommentsToSubjects = async (sourceSubjectId, category, targetSubjectIds) => {
    const sourceSubject = subjects.find(s => s.id === sourceSubjectId);
    const isSharedPeriod = category === "HPL" || category === "Language";
    const periods = isSharedPeriod ? ["shared"] : PROGRESS_PERIODS;

    for (const targetSubjectId of targetSubjectIds) {
      for (const period of periods) {
        const sourceComments = comments.filter(c =>
          c.subject_id === sourceSubjectId && c.category === category && c.period === period
        );
        const existingTargetComments = comments.filter(c =>
          c.subject_id === targetSubjectId && c.category === category && c.period === period
        );
        const commentsToCreate = sourceComments
          .filter(sc => !existingTargetComments.some(ec =>
            ec.text === sc.text && ec.level === sc.level &&
            (ec.skill_tab || "General") === (sc.skill_tab || "General")))
          .map(sc => ({
            subject_id: targetSubjectId,
            category: sc.category,
            level: sc.level,
            text: sc.text,
            period: sc.period,
            skill_tab: sc.skill_tab || "General",
            sort_order: 0,
          }));
        if (commentsToCreate.length > 0) await bulkCreate(COL.comments, commentsToCreate);
      }

      if (sourceSubject?.skill_tabs?.[category]) {
        const targetSubject = subjects.find(s => s.id === targetSubjectId);
        const existingTabs = targetSubject?.skill_tabs?.[category] || ["General"];
        const merged = Array.from(new Set([...existingTabs, ...sourceSubject.skill_tabs[category]]));
        await updateDoc(doc(db, COL.subjects, targetSubjectId), {
          skill_tabs: { ...(targetSubject?.skill_tabs || {}), [category]: merged },
        });
      }
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
    setLogo,
    reload: () => {}, // live updates make manual reloads unnecessary
  };
}
