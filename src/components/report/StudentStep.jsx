import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle, FileText, Trash2, Globe, Share2,
  Copy, Check
} from "lucide-react";
import CommentCategory from "./CommentCategory.jsx";
import { PROGRESS_PERIODS, bankCategory, ADMIN_CATEGORY_IDS } from "@/lib/constants";

export default function StudentStep({
  subject,
  student,
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
  onSharePeriod,
  onDeleteAllComments,
  reportPeriod,
  onAddSkill,
  onDeleteSkill,
}) {
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [activeSkills, setActiveSkills] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveCatIndex(0);
  }, [student]);

  const activeCategory = categories[activeCatIndex] || categories[0];
  const isLastCategory = activeCatIndex === categories.length - 1;
  // Sharing Attitude to Learning and Homework across subjects is admin-only
  const isSubjectShareable = false;
  // Attitude to Learning and Homework are shared to every report by the admin
  const isPeriodShareable = !["Language", ...ADMIN_CATEGORY_IDS].includes(activeCategory?.id);
  const isSkillCategory = !ADMIN_CATEGORY_IDS.includes(activeCategory?.id);

  const currentSkillTabs = isSkillCategory
    ? (subject?.skill_tabs?.[bankCategory(activeCategory?.id)] || []).filter(t => t !== "General")
    : ["General"];

  const getSkill = (catId) => activeSkills[catId] || "";

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
    navigator.clipboard.writeText(bulletText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!activeCategory) return null;

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-xl shadow-lg border-l-4 border-l-accent">
        <Badge variant="secondary" className="mb-2 text-xs font-bold uppercase tracking-wide">
          Student {studentIndex + 1} of {totalStudents}
        </Badge>
        <h2 className="text-3xl font-extrabold">{student}</h2>
      </div>

      {/* Category Progress Tabs */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, idx) => {
              const textVal = classData[student]?.[cat.id] || "";
              const hasData = textVal.trim().length > 0;
              const isActive = activeCatIndex === idx;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCatIndex(idx)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
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
        <CardHeader className="bg-muted/50 border-b">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" /> {activeCategory.label}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive text-xs"
                onClick={() => onDeleteAllComments(activeCategory.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Clear Bank
              </Button>
              {isSubjectShareable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-700 text-xs"
                  onClick={() => onOpenShareModal(activeCategory.id)}
                >
                  <Globe className="w-3 h-3 mr-1" /> Share w/ Subjects
                </Button>
              )}
              {isPeriodShareable && PROGRESS_PERIODS.includes(reportPeriod) && (
                <Button variant="outline" size="sm" className="text-indigo-700 text-xs" onClick={() => onSharePeriod(activeCategory.id)}>
                  <Share2 className="w-3 h-3 mr-1" /> Share with Progress Report
                </Button>
              )}
            </div>
          </div>
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
          />
        </CardContent>
      </Card>

      {/* Preview Panel — bullet point format */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
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
      </div>
    </div>
  );
}
