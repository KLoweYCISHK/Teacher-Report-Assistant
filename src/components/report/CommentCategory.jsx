import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, Save, X, Pencil, Trash2, CheckCircle, LayoutList } from "lucide-react";
import { getCategoryLevels, normaliseLevel, supportsTabs, getLevelColour } from "@/lib/constants";

const ALL_LEVELS = "__all__";

export default function CommentCategory({
  category,
  comments,
  currentValue,
  onChange,
  onAddComment,
  onBulkAddComments,
  onEditComment,
  onDeleteComment,
  onAddSkill,
  onDeleteSkill,
  skillTabs,
  activeSkill,
  onSwitchSkill,
  onNextCategory,
  onPrevCategory,
  prevLabel = "Previous Category",
  isLastCategory,
  usedElsewhere,
  pickCount = 1,
  selectedParts,
  onChangeParts,
}) {
  // Multi-pick (Chinese Reading / Writing): several comments join into one bullet point
  const isMulti = pickCount > 1 && Array.isArray(selectedParts) && !!onChangeParts;
  const isPicked = (text) => isMulti ? selectedParts.includes(text) : currentValue === text;
  const levels = getCategoryLevels(category.id);
  const [activeLevel, setActiveLevel] = useState(levels[0] || null);
  const [isAdding, setIsAdding] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [bulkComments, setBulkComments] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");

  const supportsSkills = supportsTabs(category.id);
  const currentDisplaySkill = supportsSkills ? activeSkill : "General";

  useEffect(() => {
    setActiveLevel(levels[0] || null);
  }, [category.id]);

  useEffect(() => {
    if (supportsSkills && (!activeSkill || !skillTabs.includes(activeSkill))) {
      onSwitchSkill(skillTabs[0] || "");
    }
  }, [skillTabs, activeSkill, supportsSkills, onSwitchSkill]);

  const isViewAll = activeLevel === ALL_LEVELS;
  const levelOf = (c) => normaliseLevel(category.id, c.level);
  const levelRank = (c) => { const i = levels.indexOf(levelOf(c)); return i < 0 ? levels.length : i; };

  const activeComments = comments
    .filter(c =>
      (c.skill_tab || "General") === currentDisplaySkill &&
      (isViewAll ? true : levelOf(c) === activeLevel)
    )
    .sort((a, b) => (isViewAll ? levelRank(a) - levelRank(b) : 0));

  const levelStyle = (lvl) => {
    const col = getLevelColour(category.id, lvl);
    return col ? { backgroundColor: col.bg, borderColor: col.border, color: col.text } : undefined;
  };

  const handleSelectComment = (text) => {
    if (isMulti) {
      if (selectedParts.includes(text)) { onChangeParts(selectedParts.filter(t => t !== text)); return; }
      if (selectedParts.length >= pickCount) {
        alert(`You can choose ${pickCount} comments here. Untick one first.`);
        return;
      }
      onChangeParts([...selectedParts, text]);
      return;
    }
    // Toggle: clicking selected comment deselects it
    onChange(currentValue === text ? "" : text);
  };

  const handleSaveNew = () => {
    if (!currentDisplaySkill) { alert("Add a custom tab first using the + button."); return; }
    if (newComment.trim() && activeLevel) {
      onAddComment(activeLevel, newComment.trim(), currentDisplaySkill);
      setNewComment("");
      setIsAdding(false);
    }
  };

  const handleBulkSave = async () => {
    if (!currentDisplaySkill) { setBulkMsg("Add a custom tab first using the + button."); setTimeout(() => setBulkMsg(""), 2500); return; }
    const lines = bulkComments.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0 || !activeLevel || !onBulkAddComments) {
      setBulkMsg(lines.length === 0 ? "Type at least one comment first." : "Select a level first.");
      setTimeout(() => setBulkMsg(""), 2500);
      return;
    }
    setBulkSaving(true);
    setBulkMsg("Saving...");
    try {
      await onBulkAddComments(activeLevel, lines, currentDisplaySkill);
      setBulkComments("");
      setIsBulkAdding(false);
      setBulkMsg(`Added ${lines.length} comments!`);
      setTimeout(() => setBulkMsg(""), 2500);
    } catch (e) {
      setBulkMsg("Failed to save. Please try again.");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleSaveEdit = (id) => {
    if (editText.trim()) {
      onEditComment(id, editText.trim());
      setEditingId(null);
    }
  };

  const handleAddSkillPrompt = () => {
    const name = prompt("Enter new custom tab name (e.g. 'Analysis', 'Grammar'):");
    if (name && name.trim()) onAddSkill(name.trim());
  };

  return (
    <div className="w-full space-y-4">
      {/* Skill Tabs */}
      {supportsSkills && (
        <div className="sticky top-0 bg-white dark:bg-slate-950 z-10 border-b border-border pb-3 -mx-6 px-6 pt-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase mr-1">Tabs:</span>
            {skillTabs.map(skill => (
              <div key={skill} className="relative group">
                <button
                  title={usedElsewhere?.skill === skill ? "Already used in 1. Performance based" : undefined}
                  onClick={() => {
                    onSwitchSkill(skill);
                    setIsAdding(false);
                    setIsManaging(false);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${
                    usedElsewhere?.skill === skill
                      ? activeSkill === skill
                        ? "bg-red-600 text-white shadow-md ring-2 ring-red-300"
                        : "bg-red-100 text-red-700 border border-red-400 hover:bg-red-200"
                      : activeSkill === skill
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {skill}
                </button>
                {skill !== "General" && activeSkill === skill && onDeleteSkill && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSkill(skill); }}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddSkillPrompt}
              className="p-1 bg-green-50 text-green-600 rounded-full hover:bg-green-100 border border-green-200"
              title="Add Custom Tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chinese Reading / Writing: staff must pick exactly 2 comments */}
      {isMulti && (
        <div className={`rounded-lg border-2 px-4 py-3 text-sm font-bold ${
          selectedParts.length === pickCount ? "bg-green-50 border-green-300 text-green-800" : "bg-amber-50 border-amber-300 text-amber-900"
        }`}>
          You must choose {pickCount} comments for {category.label.replace(/^\d+\.\s*/, "")} ({selectedParts.length} of {pickCount} chosen).
          They will be joined with a full stop into one bullet point.
        </div>
      )}

      {/* Level Buttons */}
      {levels.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          {levels.map(lvl => (
            <button
              key={lvl}
              onClick={() => { setActiveLevel(lvl); setIsAdding(false); setIsManaging(false); }}
              style={levelStyle(lvl)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                activeLevel === lvl
                  ? "shadow-md scale-105 ring-2 ring-offset-1 ring-slate-500"
                  : "opacity-80 hover:opacity-100"
              } ${
                usedElsewhere?.level && usedElsewhere.skill === currentDisplaySkill &&
                normaliseLevel(category.id, usedElsewhere.level) === lvl
                  ? "ring-2 ring-red-400"
                  : ""
              }`}
            >
              {lvl}
            </button>
          ))}
          <button
            onClick={() => { setActiveLevel(ALL_LEVELS); setIsAdding(false); setIsBulkAdding(false); setIsManaging(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all flex items-center gap-1.5 ${
              isViewAll
                ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 ring-2 ring-offset-1 ring-slate-500"
                : "bg-card text-foreground border-border hover:bg-muted"
            }`}
            title="See every comment in this category, colour-coded by level"
          >
            <LayoutList className="w-4 h-4" /> View All
          </button>
        </div>
      )}

      {/* Comment List */}
      {activeLevel && (
        <div className="bg-accent/5 p-4 rounded-lg border border-accent/20 space-y-3">
          <div className="flex justify-between items-center border-b border-accent/20 pb-2">
            <span className="text-sm font-bold text-primary uppercase">
              {supportsSkills && currentDisplaySkill !== "General" ? `${currentDisplaySkill} · ` : ""}
              {isViewAll ? "All Comments (all levels)" : levels.length > 1 ? `${activeLevel} Comments` : "Comments"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setIsManaging(!isManaging); setIsAdding(false); }}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                  isManaging ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Settings className="w-3 h-3" /> Manage
              </button>
              {!isViewAll && (<>
              <button
                onClick={() => { setIsAdding(!isAdding); setIsManaging(false); setIsBulkAdding(false); }}
                className="text-xs text-accent font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Add New
              </button>
              <button
                onClick={() => { setIsBulkAdding(!isBulkAdding); setIsAdding(false); setIsManaging(false); }}
                className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Bulk Add
              </button>
              </>)}
            </div>
          </div>

          {isAdding && (
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type new comment..."
                className="flex-1"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveNew()}
              />
              <Button size="sm" variant="default" onClick={handleSaveNew}>Save</Button>
            </div>
          )}

          {isBulkAdding && (
            <div className="space-y-2">
              <Textarea
                value={bulkComments}
                onChange={(e) => setBulkComments(e.target.value)}
                placeholder="Paste multiple comments here, one per line..."
                className="h-32 font-mono text-sm"
                autoFocus
                disabled={bulkSaving}
              />
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="default" onClick={handleBulkSave} disabled={bulkSaving}>
                  {bulkSaving ? "Saving..." : "Add All"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setIsBulkAdding(false); setBulkComments(""); }} disabled={bulkSaving}>Cancel</Button>
                {bulkMsg && <span className="text-xs font-semibold text-accent">{bulkMsg}</span>}
              </div>
            </div>
          )}

          {isManaging ? (
            <div className="bg-card border border-border rounded-lg p-2 max-h-96 overflow-y-auto">
              {activeComments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>
              )}
              {activeComments.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs py-2 border-b last:border-0 border-muted">
                  {editingId === c.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 h-7 text-xs"
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(c.id)}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleSaveEdit(c.id)}>
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setEditingId(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 mr-2 text-foreground">
                        {isViewAll && (
                          <span style={levelStyle(levelOf(c))} className="inline-block mr-2 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase">{levelOf(c)}</span>
                        )}
                        {c.text}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingId(c.id); setEditText(c.text); }} className="text-accent hover:text-accent/80">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (confirm("Delete this comment?")) onDeleteComment(c.id); }} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto">
              {activeComments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">{isViewAll ? "No comments in this tab yet." : "No comments available. Add some above."}</p>
              )}
              {activeComments.map(c => {
                const isSelected = isPicked(c.text);
                const isUsedElsewhere = usedElsewhere && c.text.trim() === usedElsewhere.text.trim();
                if (isViewAll) {
                  const lvl = levelOf(c);
                  const col = getLevelColour(category.id, lvl);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectComment(c.text)}
                      style={col ? { backgroundColor: col.bg, borderColor: isSelected ? "#1e293b" : col.border } : undefined}
                      className={`w-full text-left text-base leading-snug px-4 py-2.5 rounded-lg transition-all flex items-start gap-3 text-slate-900 hover:brightness-95 ${
                        isSelected ? "border-[3px] shadow-md font-medium" : "border-2"
                      } ${isUsedElsewhere ? "ring-2 ring-red-500" : ""}`}
                    >
                      <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-slate-800 bg-slate-800" : "border-slate-500/60 bg-white/60"}`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </span>
                      <span>
                        <span style={col ? { color: col.text } : undefined} className="block text-[10px] font-bold uppercase tracking-wide mb-0.5">
                          {lvl}{isUsedElsewhere ? " · Already used in 1. Performance based" : ""}
                        </span>
                        {c.text}
                      </span>
                    </button>
                  );
                }
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectComment(c.text)}
                    className={`w-full text-left text-base leading-snug px-4 py-2.5 rounded-lg border transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-accent/10 border-accent text-foreground font-medium"
                        : isUsedElsewhere
                          ? "bg-red-50 border-red-400 text-red-800 hover:bg-red-100"
                          : "bg-card border-border hover:bg-muted/60 hover:border-accent/40 text-foreground"
                    }`}
                  >
                    <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-accent bg-accent" : "border-muted-foreground/40"}`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </span>
                    <span>
                      {isUsedElsewhere && (
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-red-600 mb-0.5">Already used in 1. Performance based</span>
                      )}
                      {c.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected comment display */}
      {currentValue && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-green-700 uppercase mb-1">
              {isMulti ? `Selected Comments (${selectedParts.length} of ${pickCount}) — shown as one bullet point` : "Selected Comment"}
            </p>
            <p className="text-base text-green-900">{currentValue}</p>
          </div>
          <button onClick={() => isMulti ? onChangeParts([]) : onChange("")} className="text-green-600 hover:text-destructive ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Previous / Next Category buttons */}
      {(onNextCategory || onPrevCategory) && (
        <div className="sticky bottom-24 z-30 flex justify-between items-center gap-3 pt-2">
          {onPrevCategory ? (
            <Button variant="outline" onClick={onPrevCategory} className="font-bold bg-card shadow-sm">
              ← {prevLabel}
            </Button>
          ) : <span />}
          {onNextCategory && (
          <Button
            onClick={onNextCategory}
            disabled={isMulti ? selectedParts.length !== pickCount : !currentValue}
            title={isMulti && selectedParts.length !== pickCount ? `Choose ${pickCount} comments to continue` : undefined}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
          >
            Next Category →
          </Button>
          )}
        </div>
      )}
    </div>
  );
}
