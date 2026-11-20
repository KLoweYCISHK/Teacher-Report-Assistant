import React, { useState, useCallback, useEffect } from "react";
import { useReportData } from "@/lib/useReportData";
import { getCommentPeriod, getCategoryLabel, bankCategory, ADMIN_PASSWORD, ADMIN_CATEGORY_IDS, PERIOD_SHARE_CATEGORY_IDS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

import Header from "@/components/report/Header";
import ClassSetup from "@/components/report/ClassSetup";
import StudentStep from "@/components/report/StudentStep.jsx";
import ActionPanel from "@/components/report/ActionPanel";
import ResultPanel from "@/components/report/ResultPanel.jsx";

import ShareModal from "@/components/report/ShareModal";
import PeriodShareModal from "@/components/report/PeriodShareModal";
import ImportExcelModal from "@/components/report/ImportExcelModal";
import AdminPanel from "@/components/report/AdminPanel.jsx";
import SavedClasses from "@/components/report/SavedClasses.jsx";
import { saveClass, newClassId } from "@/lib/savedClasses";

export default function Home() {
  const data = useReportData();

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("Progress 2");
  const [students, setStudents] = useState([]);
  const [studentInfo, setStudentInfo] = useState({}); // ManageBac grade + ATL, browser only
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [classData, setClassData] = useState({});
  const [activeCategories, setActiveCategories] = useState([]);
  const [finalBatchPrompt, setFinalBatchPrompt] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPeriodShare, setShowPeriodShare] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Saved progress for this class (browser only)
  const [classId, setClassId] = useState(null);
  const [className, setClassName] = useState("");

  const handleOpenAdmin = () => {
    const pw = prompt("Enter the admin password:");
    if (pw === null) return;
    if (pw === ADMIN_PASSWORD) setIsAdmin(true);
    else alert("Incorrect password.");
  };

  const isSetup = students.length === 0;
  const isResultStep = !isSetup && currentStepIndex === students.length;
  const activeStudent = !isSetup && !isResultStep ? students[currentStepIndex] : null;

  const isCurrentStudentComplete = activeStudent
    ? activeCategories.every(c => (classData[activeStudent]?.[c.id] || "").trim().length > 0)
    : true;

  // Resolve period for a category
  const getEffectivePeriod = useCallback((categoryId) => {
    const shared = getCommentPeriod(categoryId);
    return shared || reportPeriod;
  }, [reportPeriod]);

  // Get comments for a specific category + skill tab
  const getCommentsForCategory = useCallback((categoryId, skillTab = "General") => {
    if (!selectedSubject) return [];
    const period = getEffectivePeriod(categoryId);
    return data.comments.filter(c =>
      c.subject_id === selectedSubject.id &&
      c.category === categoryId &&
      c.period === period &&
      (c.skill_tab || "General") === skillTab
    );
  }, [selectedSubject, data.comments, getEffectivePeriod]);

  const handleStartClass = (names, categories, info = {}, name = "") => {
    setClassId(newClassId());
    setClassName(name || `${selectedSubject?.name || "Class"} – ${reportPeriod}`);
    setStudents(names);
    setStudentInfo(info);
    setActiveCategories(categories);
    const initData = {};
    names.forEach(n => { initData[n] = {}; });
    setClassData(initData);
    setCurrentStepIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateStudent = (name, catId, val) => {
    setClassData(prev => ({ ...prev, [name]: { ...prev[name], [catId]: val } }));
  };

  const handleAddComment = async (categoryId, level, text, skillTab = "General") => {
    categoryId = bankCategory(categoryId);
    const period = getEffectivePeriod(categoryId);
    await data.addComment(selectedSubject.id, categoryId, level, text, period, skillTab);
  };

  const handleBulkAddComments = async (categoryId, level, texts, skillTab = "General") => {
    categoryId = bankCategory(categoryId);
    const period = getEffectivePeriod(categoryId);
    await data.bulkAddComments(selectedSubject.id, categoryId, level, texts, period, skillTab);
  };

  const handleUpdateMockTitle = async (subjectId, idx, val) => {
    const subj = data.subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const titles = [...(subj.mock_titles || ["", "", "", "", ""])];
    titles[idx] = val;
    await data.updateSubject(subjectId, { mock_titles: titles });
  };

  const handleAddSkill = async (categoryId, skillName) => {
    categoryId = bankCategory(categoryId);
    if (!syncedSubject) return;
    const existing = (syncedSubject.skill_tabs?.[categoryId] || []).filter(t => t !== "General");
    if (!existing.includes(skillName)) {
      await data.updateSubject(syncedSubject.id, {
        skill_tabs: { ...(syncedSubject.skill_tabs || {}), [categoryId]: [...existing, skillName] },
      });
    }
  };

  const handleDeleteSkill = async (categoryId, skillName) => {
    categoryId = bankCategory(categoryId);
    if (!syncedSubject) return;
    const existing = syncedSubject.skill_tabs?.[categoryId] || [];
    const filtered = existing.filter(s => s !== skillName);
    const final = filtered;
    await data.updateSubject(syncedSubject.id, {
      skill_tabs: { ...(syncedSubject.skill_tabs || {}), [categoryId]: final },
    });
  };

  const handleDeleteAllComments = async (categoryId) => {
    categoryId = bankCategory(categoryId);
    if (!selectedSubject) return;
    const displayCat = getCategoryLabel(categoryId);
    const period = getEffectivePeriod(categoryId);
    if (!confirm(`Delete ALL ${displayCat} comments for ${selectedSubject.name} in ${period}?`)) return;
    await data.deleteAllCommentsInCategory(selectedSubject.id, categoryId, period);
  };

  const handleShareToSubjects = async (selectedSubjectIds, cats) => {
    if (!selectedSubject || !cats?.length) return;
    try {
      await data.shareCommentsToSubjects(selectedSubject.id, cats, selectedSubjectIds);
      alert(`Shared successfully to ${selectedSubjectIds.length} subject${selectedSubjectIds.length === 1 ? "" : "s"}!`);
    } catch (e) {
      console.error(e);
      alert("Sharing failed. Please try again.");
      return;
    }
    setShowShareModal(false);
  };

  // Copies the chosen categories to later progress reports
  const handleSharePeriods = async (targetPeriods, cats) => {
    if (!selectedSubject || !cats?.length) return;
    const sourcePeriod = reportPeriod;
    const list = targetPeriods.join(" and ");
    const catNames = cats.map(c => c === "Assessment" ? "Performance based" : getCategoryLabel(c)).join(", ");
    if (!confirm(`Replace the ${catNames} comments in ${list} with ${sourcePeriod}'s?`)) return;
    try {
      for (const target of targetPeriods) {
        for (const cat of cats) {
          await data.sharePeriodComments(selectedSubject.id, cat, sourcePeriod, target);
        }
      }
      alert(`Successfully copied to ${list}!`);
      setShowPeriodShare(false);
    } catch (e) {
      console.error(e);
      alert("Sharing failed. Please try again.");
    }
  };

  // Excel import into the current subject and report period
  const handleImportExcel = async (plan) => {
    if (!selectedSubject || plan.length === 0) return false;
    try {
      const sheets = plan.map(p => ({ ...p, categoryId: bankCategory(p.categoryId) }));
      const { added, skipped } = await data.importCommentBank(selectedSubject.id, reportPeriod, sheets);
      alert(`Imported ${added} comment${added === 1 ? "" : "s"}` + (skipped ? ` (${skipped} already in the bank were skipped).` : "."));
      return true;
    } catch (e) {
      console.error(e);
      alert("Import failed. Please try again.");
      return false;
    }
  };

  // Pull the admin (PLT) Attitude to Learning and Homework banks into the chosen subjects
  const handleApplyPlt = async (subjectIds) => {
    try {
      await data.applyPltComments(subjectIds);
      alert(`PLT Generated comments added to ${subjectIds.length} subject${subjectIds.length === 1 ? "" : "s"}.`);
      return true;
    } catch (e) {
      console.error(e);
      alert(e.message === "NO_PLT_COMMENTS"
        ? "No PLT Generated comments have been added on the admin page yet."
        : "Could not add the PLT comments. Please try again.");
      return false;
    }
  };

  const buildBatch = (names, cats, cData) => {
    let out = "";
    names.forEach((s, index) => {
      out += `${s}\n`;
      const cmts = cats
        .map(c => (cData[s]?.[c.id] || "").trim())
        .filter(Boolean);
      if (cmts.length > 0) out += cmts.join("\n") + "\n";
      if (index < names.length - 1) out += "\n-----------------------------------\n\n";
    });
    return out;
  };

  const generateFinalBatch = () => setFinalBatchPrompt(buildBatch(students, activeCategories, classData));

  // Save progress to this browser whenever it changes (never to Firebase)
  useEffect(() => {
    if (!classId || students.length === 0 || !selectedSubject) return;
    saveClass({
      id: classId,
      name: className,
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      reportPeriod,
      students,
      studentInfo,
      categories: activeCategories,
      classData,
      stepIndex: currentStepIndex,
    });
  }, [classId, className, students, studentInfo, activeCategories, classData, currentStepIndex, selectedSubject, reportPeriod]);

  // Carry on with a class saved in this browser
  const handleResume = (saved) => {
    const subj = data.subjects.find(s => s.id === saved.subjectId);
    if (!subj) {
      alert(`The subject "${saved.subjectName}" can't be found any more, so this class can't be opened.`);
      return;
    }
    setSelectedDept(data.departments.find(d => d.id === subj.department_id) || null);
    setSelectedSubject(subj);
    setReportPeriod(saved.reportPeriod);
    setClassId(saved.id);
    setClassName(saved.name);
    setStudents(saved.students);
    setStudentInfo(saved.studentInfo || {});
    setActiveCategories(saved.categories);
    setClassData(saved.classData || {});
    const step = Math.min(saved.stepIndex || 0, saved.students.length);
    if (step === saved.students.length) setFinalBatchPrompt(buildBatch(saved.students, saved.categories, saved.classData || {}));
    setCurrentStepIndex(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReturnStart = () => {
    if (confirm(`Return to start? Your progress on "${className}" is saved in this browser, so you can continue it later.`)) {
      setClassId(null);
      setStudents([]);
      setCurrentStepIndex(0);
      setClassData({});
      setSelectedSubject(null);
    }
  };

  // Keep selectedSubject in sync with data.subjects changes (real-time updates)
  const syncedSubject = selectedSubject ? data.subjects.find(s => s.id === selectedSubject.id) : null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header
        logoUrl={data.logoUrl}
        onSetLogo={data.setLogo}
        onOpenAdmin={isSetup && !isAdmin ? handleOpenAdmin : null}
        wide={!!activeStudent}
      />
      {data.loading && (
        <p className="text-center text-sm text-muted-foreground mt-4 relative z-20">Loading comment banks…</p>
      )}
      <main className={`${activeStudent ? "max-w-[1500px]" : "max-w-5xl"} mx-auto px-4 sm:px-6 -mt-8 relative z-10`}>
        {isAdmin && (
          <AdminPanel data={data} onExit={() => setIsAdmin(false)} />
        )}

        {isSetup && !isAdmin && (
          <SavedClasses onResume={handleResume} disabled={data.loading} />
        )}

        {isSetup && !isAdmin && (
          <ClassSetup
            departments={data.departments}
            subjects={data.subjects}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            selectedSubject={syncedSubject}
            setSelectedSubject={(s) => setSelectedSubject(s)}
            reportPeriod={reportPeriod}
            setReportPeriod={setReportPeriod}
            onStartClass={handleStartClass}
            onAddSubject={async (name, type, deptId) => {
              const newSubj = await data.addSubject(name, type, deptId);
              setSelectedSubject(newSubj);
            }}
            onDeleteSubject={async (id) => {
              await data.deleteSubject(id);
              setSelectedSubject(null);
            }}
            onAddDepartment={async (name) => {
              const newDept = await data.addDepartment(name);
              setSelectedDept(newDept);
            }}
            onDeleteDepartment={async (id) => {
              await data.deleteDepartment(id);
              setSelectedDept(null);
              setSelectedSubject(null);
            }}
            onUpdateMockTitle={handleUpdateMockTitle}
            onApplyPlt={handleApplyPlt}
            onOpenImport={() => setShowImport(true)}
          />
        )}

        {activeStudent && syncedSubject && (
          <StudentStep
            key={activeStudent}
            subject={syncedSubject}
            student={activeStudent}
            studentInfo={studentInfo[activeStudent]}
            studentIndex={currentStepIndex}
            totalStudents={students.length}
            categories={activeCategories}
            classData={classData}
            comments={data.comments}
            getCommentsForCategory={(catId, skill) => {
              catId = bankCategory(catId);
              const period = getEffectivePeriod(catId);
              const filtered = data.comments.filter(c =>
                c.subject_id === syncedSubject.id &&
                c.category === catId &&
                (c.period === period || c.period === 'shared') &&
                (c.skill_tab || "General") === (skill || "General")
              );
              // Deduplicate by text
              const seen = new Set();
              return filtered.filter(c => {
                if (seen.has(c.text)) return false;
                seen.add(c.text);
                return true;
              });
            }}
            onUpdateStudent={handleUpdateStudent}
            onAddComment={handleAddComment}
            onBulkAddComments={handleBulkAddComments}
            onEditComment={async (id, newText) => await data.editComment(id, newText)}
            onDeleteComment={async (id) => await data.deleteComment(id)}
            onOpenShareModal={() => setShowShareModal(true)}
            onOpenImport={() => setShowImport(true)}
            onSharePeriod={() => setShowPeriodShare(true)}
            onDeleteAllComments={handleDeleteAllComments}
            reportPeriod={reportPeriod}
            onAddSkill={handleAddSkill}
            onDeleteSkill={handleDeleteSkill}
          />
        )}

        {isResultStep && (
          <ResultPanel prompt={finalBatchPrompt} onStartOver={() => window.location.reload()} />
        )}
      </main>

      {!isSetup && !isResultStep && (
        <ActionPanel
          onBack={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
          onReturnStart={handleReturnStart}
          onNext={() => {
            if (currentStepIndex === students.length - 1) generateFinalBatch();
            setCurrentStepIndex(currentStepIndex + 1);
            window.scrollTo(0, 0);
          }}
          isLastStep={currentStepIndex === students.length - 1}
          wide={!!activeStudent}
          savedNote={classId ? `✓ "${className}" saved in this browser` : null}
          disableNext={!isCurrentStudentComplete}
        />
      )}

      {showPeriodShare && (
        <PeriodShareModal
          sourcePeriod={reportPeriod}
          onClose={() => setShowPeriodShare(false)}
          onConfirm={handleSharePeriods}
        />
      )}

      {showImport && syncedSubject && (
        <ImportExcelModal
          subjectName={syncedSubject.name}
          reportPeriod={reportPeriod}
          onClose={() => setShowImport(false)}
          onConfirm={handleImportExcel}
        />
      )}

      {showShareModal && syncedSubject && (
        <ShareModal
          currentSubjectId={syncedSubject.id}
          subjects={data.subjects}
          departments={data.departments}
          onClose={() => setShowShareModal(false)}
          onConfirm={handleShareToSubjects}
        />
      )}
    </div>
  );
}
