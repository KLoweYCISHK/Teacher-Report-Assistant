import React, { useState, useCallback, useEffect } from "react";
import { useReportData } from "@/lib/useReportData";
import { getCommentPeriod, getCategoryLabel, bankCategory, ADMIN_PASSWORD } from "@/lib/constants";
import { Button } from "@/components/ui/button";

import Header from "@/components/report/Header";
import ClassSetup from "@/components/report/ClassSetup";
import StudentStep from "@/components/report/StudentStep.jsx";
import ActionPanel from "@/components/report/ActionPanel";
import ResultPanel from "@/components/report/ResultPanel.jsx";

import ShareModal from "@/components/report/ShareModal";
import PeriodShareModal from "@/components/report/PeriodShareModal";
import AdminPanel from "@/components/report/AdminPanel.jsx";

export default function Home() {
  const data = useReportData();

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("Progress 2");
  const [students, setStudents] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [classData, setClassData] = useState({});
  const [activeCategories, setActiveCategories] = useState([]);
  const [finalBatchPrompt, setFinalBatchPrompt] = useState("");
  const [shareModalData, setShareModalData] = useState(null);
  const [periodShareCat, setPeriodShareCat] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleStartClass = (names, categories) => {
    setStudents(names);
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
    if (!syncedSubject || categoryId === "Homework") return;
    const existing = (syncedSubject.skill_tabs?.[categoryId] || []).filter(t => t !== "General");
    if (!existing.includes(skillName)) {
      await data.updateSubject(syncedSubject.id, {
        skill_tabs: { ...(syncedSubject.skill_tabs || {}), [categoryId]: [...existing, skillName] },
      });
    }
  };

  const handleDeleteSkill = async (categoryId, skillName) => {
    categoryId = bankCategory(categoryId);
    if (!syncedSubject || categoryId === "Homework") return;
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

  const handleShareToSubjects = async (selectedSubjectIds) => {
    if (!shareModalData || !selectedSubject) return;
    await data.shareCommentsToSubjects(selectedSubject.id, shareModalData.catId, selectedSubjectIds);
    alert(`Shared successfully to ${selectedSubjectIds.length} subjects!`);
    setShareModalData(null);
  };

  const handleSharePeriods = async (targetPeriods) => {
    if (!selectedSubject || !periodShareCat) return;
    const sourcePeriod = reportPeriod;
    const list = targetPeriods.join(" and ");
    if (!confirm(`Replace all ${periodShareCat} comments in ${list} with data from ${sourcePeriod}?`)) return;
    for (const target of targetPeriods) {
      await data.sharePeriodComments(selectedSubject.id, periodShareCat, sourcePeriod, target);
    }
    alert(`Successfully copied to ${list}!`);
    setPeriodShareCat(null);
  };

  const generateFinalBatch = () => {
    let out = "";
    students.forEach((s, index) => {
      out += `${s}\n`;
      const cmts = activeCategories
        .map(c => (classData[s]?.[c.id] || "").trim())
        .filter(Boolean);
      if (cmts.length > 0) out += cmts.join("\n") + "\n";
      if (index < students.length - 1) out += "\n-----------------------------------\n\n";
    });
    setFinalBatchPrompt(out);
  };

  const handleReturnStart = () => {
    if (confirm("Return to start? Current student progress will be lost.")) {
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
      />
      {data.loading && (
        <p className="text-center text-sm text-muted-foreground mt-4 relative z-20">Loading comment banks…</p>
      )}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        {isAdmin && (
          <AdminPanel data={data} subjectCount={data.subjects.length} onExit={() => setIsAdmin(false)} />
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
          />
        )}

        {activeStudent && syncedSubject && (
          <StudentStep
            key={activeStudent}
            subject={syncedSubject}
            student={activeStudent}
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
            onOpenShareModal={(catId) => setShareModalData({ catId: bankCategory(catId) })}
            onSharePeriod={(catId) => setPeriodShareCat(bankCategory(catId))}
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
          disableNext={!isCurrentStudentComplete}
        />
      )}

      {periodShareCat && (
        <PeriodShareModal
          categoryId={periodShareCat}
          sourcePeriod={reportPeriod}
          onClose={() => setPeriodShareCat(null)}
          onConfirm={handleSharePeriods}
        />
      )}

      {shareModalData && syncedSubject && (
        <ShareModal
          categoryId={shareModalData.catId}
          currentSubjectId={syncedSubject.id}
          subjects={data.subjects}
          departments={data.departments}
          onClose={() => setShareModalData(null)}
          onConfirm={handleShareToSubjects}
        />
      )}
    </div>
  );
}
