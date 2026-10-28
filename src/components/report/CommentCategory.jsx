import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, Save, X, Pencil, Trash2, CheckCircle } from "lucide-react";
import { getCategoryLevels, normaliseLevel, ADMIN_CATEGORY_IDS } from "@/lib/constants";

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
  isLastCategory,
}) {
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

  const supportsSkills = !ADMIN_CATEGORY_IDS.includes(category.id);
  const currentDisplaySkill = supportsSkills ? activeSkill : "General";

  useEffect(() => {
    setActiveLevel(levels[0] || null);
  }, [category.id]);

  useEffect(() => {
    if (supportsSkills && (!activeSkill || !skillTabs.includes(activeSkill))) {
      onSwitchSkill(skillTabs[0] || "");
    }
  }, [skillTabs, activeSkill, supportsSkills, onSwitchSkill]);

  const activeComments = comments.filter(
    c => normaliseLevel(category.id, c.level) === activeLevel && (c.skill_tab || "General") === currentDisplaySkill
  );

  const handleSelectComment = (text) => {
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
                  onClick={() => {
                    onSwitchSkill(skill);
                    setIsAdding(false);
                    setIsManaging(false);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activeSkill === skill
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {skill}
                </button>
                {skill !== "General" && activeSkill === skill && (
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

      {/* Level Buttons */}
      {levels.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          {levels.map(lvl => (
            <button
              key={lvl}
              onClick={() => { setActiveLevel(lvl); setIsAdding(false); setIsManaging(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activeLevel === lvl
                  ? "bg-accent text-accent-foreground border-accent shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      )}

      {/* Comment List */}
      {activeLevel && (
        <div className="bg-accent/5 p-4 rounded-lg border border-accent/20 space-y-3">
          <div className="flex justify-between items-center border-b border-accent/20 pb-2">
            <span className="text-xs font-bold text-primary uppercase">
              {supportsSkills && currentDisplaySkill !== "General" ? `${currentDisplaySkill} · ` : ""}
              {levels.length > 1 ? `${activeLevel} Comments` : "Comments"}
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
            <div className="bg-card border border-border rounded-lg p-2 max-h-48 overflow-y-auto">
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
                      <span className="flex-1 mr-2 text-foreground">{c.text}</span>
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeComments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No comments available. Add some above.</p>
              )}
              {activeComments.map(c => {
                const isSelected = currentValue === c.text;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectComment(c.text)}
                    className={`w-full text-left text-sm px-4 py-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-accent/10 border-accent text-foreground font-medium"
                        : "bg-card border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-accent bg-accent" : "border-muted-foreground/40"}`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </span>
                    <span>{c.text}</span>
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
            <p className="text-xs font-bold text-green-700 uppercase mb-1">Selected Comment</p>
            <p className="text-sm text-green-900">{currentValue}</p>
          </div>
          <button onClick={() => onChange("")} className="text-green-600 hover:text-destructive ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Next Category button */}
      {onNextCategory && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={onNextCategory}
            disabled={!currentValue}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
          >
            Next Category →
          </Button>
        </div>
      )}
    </div>
  );
}
