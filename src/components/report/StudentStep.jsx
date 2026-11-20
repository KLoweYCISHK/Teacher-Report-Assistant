import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle, FileText, Trash2, Globe, Share2,
  Copy, Check, FileSpreadsheet, Eye, EyeOff, Settings, X
} from "lucide-react";
import CommentCategory from "./CommentCategory.jsx";
import { ATL_FIELDS } from "@/lib/importClassList";
import { PROGRESS_PERIODS, bankCategory, ADMIN_CATEGORY_IDS, supportsTabs, getTabList } from "@/lib/constants";

export default function StudentStep({
  subject,
  student,
  studentInfo,
  studentIndex,
  totalStudents,
  categories,
  classData,
  comments,
  getCommentsForCategory,
  onUpdateStudent,
  onAddComment,
  onBulkAddComments,
  onEditComment,
  onDeleteComment,
  onOpenShareModal,
  onOpenImport,
  onSharePeriod,
  onDeleteAllComments,
  reportPeriod,
  onAddSkill,
  onDeleteSkill,
}) {
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [activeSkills, setActiveSkills] = useState({});
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // subject tools, hidden by default
  // Show/hide the Final Report box (remembered between students)
  const [showPreview, setShowPreview] = useState(() => {
    try { return localStorage.getItem("tra_showPreview") !== "0"; } catch { return true; }
  });
  const togglePreview = () => {
    setShowPreview(prev => {
      try { localStorage.setItem("tra_showPreview", prev ? "0" : "1"); } catch {}
      return !prev;
    });
  };

  useEffect(() => {
    setActiveCatIndex(0);
  }, [student]);

  const activeCategory = categories[activeCatIndex] || categories[0];
  const isLastCategory = activeCatIndex === categories.length - 1;
  // Sharing with a later progress report copies ATL, Homework, Performance based and Development together
  const isPeriodShareable = activeCategory?.id !== "Language";
  const isSkillCategory = supportsTabs(activeCategory?.id);

  const currentSkillTabs = getTabList(
    bankCategory(activeCategory?.id),
    subject?.skill_tabs?.[bankCategory(activeCategory?.id)] || []
  );

  const getSkill = (catId) => activeSkills[catId] || "";

  // On 2. Performance based, flag the tab, level and comment already used in 1. Performance based
  const firstPerformanceText = activeCategory?.id === "Performance2"
    ? (classData[student]?.Assessment || "").trim()
    : "";
  let usedElsewhere = null;
  if (firstPerformanceText) {
    for (const tab of currentSkillTabs) {
      const match = getCommentsForCategory("Assessment", tab).find(c => c.text.trim() === firstPerformanceText);
      if (match) { usedElsewhere = { text: match.text, skill: tab, level: match.level }; break; }
    }
    if (!usedElsewhere) usedElsewhere = { text: firstPerformanceText, skill: null, level: null };
  }

  const activeCommentTexts = categories
    .map(c => (classData[student]?.[c.id] || "").trim())
    .filter(Boolean);

  const handleCategoryUpdate = (catId, val) => {
    onUpdateStudent(student, catId, val);
  };

  const handleNextCategory = () => {
    if (!isLastCategory) {
      setActiveCatIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCopy = () => {
    if (activeCommentTexts.length === 0) return;
    const bulletText = activeCommentTexts.map(t => `• ${t}`).join("\n");
    // Copy as a real bulleted list (HTML) so it pastes as proper bullets into the school system
    const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<ul>${activeCommentTexts.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`;
    const write = window.ClipboardItem
      ? navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([bulletText], { type: "text/plain" }),
        })])
      : navigator.clipboard.writeText(bulletText);
    write.then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!activeCategory) return null;

  return (
    <div className="space-y-4">
      {/* Sticky student name bar */}
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground px-5 py-2.5 rounded-b-xl shadow-lg border-l-4 border-l-accent flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-xs font-bold uppercase tracking-wide">
          Student {studentIndex + 1} of {totalStudents}
        </Badge>
        <h2 className="text-lg font-extrabold">{student}</h2>
        {studentInfo && (studentInfo.grade || ATL_FIELDS.some(f => studentInfo.atl?.[f.key])) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs" title="From ManageBac">
            {studentInfo.grade && (
              <span className="bg-white text-primary rounded-md px-2 py-0.5 font-extrabold">Grade {studentInfo.grade}</span>
            )}
            {ATL_FIELDS.filter(f => studentInfo.atl?.[f.key]).map(f => (
              <span key={f.key} title={`ATL: ${f.label}`} className="bg-white/15 rounded-md px-2 py-0.5 font-semibold">
                {f.short} <span className="font-extrabold">{studentInfo.atl[f.key]}</span>
              </span>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="opacity-70 uppercase text-xs font-bold tracking-wide">Subject</span>
          <span className="bg-white/15 rounded-md pl-3 pr-1 py-1 font-extrabold text-base flex items-center gap-1">
            {subject?.name}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              title="Subject settings"
              aria-label="Subject settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </span>
          <span className="bg-accent text-accent-foreground rounded-md px-2 py-1 text-xs font-bold">{reportPeriod}</span>
          <button
            onClick={togglePreview}
            className="ml-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-primary-foreground/30 hover:bg-primary-foreground/10 transition-colors"
          >
            {showPreview
              ? <><EyeOff className="w-3.5 h-3.5" /> Hide final report</>
              : <><Eye className="w-3.5 h-3.5" /> Show final report</>}
          </button>
        </div>
      </div>

      {/* Two columns: comment picking on the left, report preview on the right */}
      <div className={showPreview
        ? "space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-5 lg:items-start"
        : "max-w-5xl mx-auto"}>
      <div className="space-y-4 min-w-0">

      {/* Category Progress Tabs */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categories</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, idx) => {
              const textVal = classData[student]?.[cat.id] || "";
              const hasData = textVal.trim().length > 0;
              const isActive = activeCatIndex === idx;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCatIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                    isActive
                      ? "bg-accent text-accent-foreground shadow-md ring-2 ring-accent ring-offset-2"
                      : hasData
                        ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {cat.label}
                  {hasData && <CheckCircle className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comment Editor */}
      <Card>
        <CardHeader className="bg-muted/50 border-b py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" /> {activeCategory.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <CommentCategory
            key={`${student}-${activeCategory.id}`}
            category={activeCategory}
            comments={getCommentsForCategory(activeCategory.id, getSkill(activeCategory.id))}
            currentValue={classData[student]?.[activeCategory.id] || ""}
            onChange={(val) => handleCategoryUpdate(activeCategory.id, val)}
            onAddComment={(level, text, skill) => onAddComment(activeCategory.id, level, text, skill)}
            onBulkAddComments={(level, texts, skill) => onBulkAddComments(activeCategory.id, level, texts, skill)}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            skillTabs={currentSkillTabs}
            activeSkill={getSkill(activeCategory.id)}
            onSwitchSkill={(skill) => setActiveSkills(prev => ({ ...prev, [activeCategory.id]: skill }))}
            onAddSkill={(skill) => onAddSkill(activeCategory.id, skill)}
            onDeleteSkill={(skill) => onDeleteSkill(activeCategory.id, skill)}
            onNextCategory={!isLastCategory ? handleNextCategory : undefined}
            isLastCategory={isLastCategory}
            usedElsewhere={usedElsewhere}
          />
        </CardContent>
      </Card>
      </div>

      {/* Preview Panel — bullet point format, kept in view on the right */}
      {showPreview && (
      <aside className="bg-accent/5 border border-accent/20 rounded-xl p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
            Final Report Preview — {student}
          </h3>
          {activeCommentTexts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${copied ? "text-green-700 border-green-300 bg-green-50" : "text-accent border-accent/30"}`}
              onClick={handleCopy}
            >
              {copied ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy Report</>}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Copy and paste this student's report straight into the school system from here, or wait and download the whole class's reports at the end.
        </p>
        <div className="bg-card p-4 rounded-lg border border-accent/10 text-sm leading-relaxed shadow-sm">
          {activeCommentTexts.length > 0 ? (
            <ul className="list-disc list-outside pl-5 space-y-1.5">
              {activeCommentTexts.map((txt, idx) => (
                <li key={idx}>{txt}</li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground italic">Comments will appear here as you select them...</span>
          )}
        </div>
      </aside>
      )}
      </div>

      {/* Subject settings side panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="bg-card w-full max-w-sm h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b bg-muted flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold flex items-center gap-2"><Settings className="w-5 h-5" /> Subject settings</h2>
                <p className="text-xs text-muted-foreground">{subject?.name} · {reportPeriod}</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">Whole subject</p>
                {onOpenImport && (
                  <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white text-sm font-bold" onClick={() => { setShowSettings(false); onOpenImport(); }}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Upload comments from Excel
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start text-purple-700 text-sm" onClick={() => { setShowSettings(false); onOpenShareModal(); }}>
                  <Globe className="w-4 h-4 mr-2" /> Share with Subjects
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">{activeCategory.label} only</p>
                {isPeriodShareable && PROGRESS_PERIODS.slice(0, -1).includes(reportPeriod) && (
                  <Button variant="outline" className="w-full justify-start text-indigo-700 text-sm" onClick={() => { setShowSettings(false); onSharePeriod(activeCategory.id); }}>
                    <Share2 className="w-4 h-4 mr-2" /> Share with Progress 3 / 4
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start text-destructive text-sm" onClick={() => { setShowSettings(false); onDeleteAllComments(activeCategory.id); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Clear Bank
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
