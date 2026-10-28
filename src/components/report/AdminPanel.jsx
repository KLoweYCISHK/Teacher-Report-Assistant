import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Globe, LogOut, X, FileText } from "lucide-react";
import CommentCategory from "./CommentCategory.jsx";
import { PROGRESS_PERIODS, ADMIN_CATEGORIES, ADMIN_SUBJECT_ID } from "@/lib/constants";

export default function AdminPanel({ data, subjectCount, onExit }) {
  const [period, setPeriod] = useState(PROGRESS_PERIODS[0]);
  const [catIndex, setCatIndex] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [targets, setTargets] = useState([...PROGRESS_PERIODS]);
  const [sharing, setSharing] = useState(false);

  const category = ADMIN_CATEGORIES[catIndex];

  const comments = data.comments.filter(c =>
    c.subject_id === ADMIN_SUBJECT_ID && c.category === category.id && c.period === period
  );

  const allSelected = PROGRESS_PERIODS.every(p => targets.includes(p));
  const toggle = (p) => setTargets(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleShare = async () => {
    if (targets.length === 0) return;
    const hasSource = data.comments.some(c => c.subject_id === ADMIN_SUBJECT_ID && c.period === period);
    if (!hasSource) { alert(`There are no ${period} comments to share yet.`); return; }
    const ordered = PROGRESS_PERIODS.filter(p => targets.includes(p));
    const list = ordered.join(", ");
    if (!confirm(
      `Share the ${period} Attitude to Learning and Homework comments to ALL ${subjectCount} subjects for ${list}?\n\nExisting comments in those categories for ${list} will be replaced.`
    )) return;
    setSharing(true);
    try {
      await data.publishAdminComments(period, ordered);
      alert(`Shared with all subjects for ${list}.`);
      setShowShare(false);
      setTargets([...PROGRESS_PERIODS]);
    } catch (e) {
      console.error(e);
      alert("Sharing failed. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5 pb-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" /> Admin: Standard Comments
            </h2>
            <Button variant="outline" size="sm" onClick={onExit}>
              <LogOut className="w-3.5 h-3.5 mr-1" /> Exit Admin
            </Button>
          </div>

          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Progress Report</p>
            <div className="flex flex-wrap gap-2">
              {PROGRESS_PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    period === p ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              {ADMIN_CATEGORIES.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setCatIndex(i)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    catIndex === i
                      ? "bg-accent text-accent-foreground shadow-md ring-2 ring-accent ring-offset-2"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50 border-b">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" /> {category.label} · {period}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="text-purple-700 text-xs"
              onClick={() => { setTargets([...PROGRESS_PERIODS]); setShowShare(true); }}
            >
              <Globe className="w-3 h-3 mr-1" /> Share with All Subjects
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <CommentCategory
            key={`${category.id}-${period}`}
            category={category}
            comments={comments}
            currentValue=""
            onChange={() => {}}
            onAddComment={(level, text) =>
              data.addComment(ADMIN_SUBJECT_ID, category.id, level, text, period, "General")}
            onBulkAddComments={(level, texts) =>
              data.bulkAddComments(ADMIN_SUBJECT_ID, category.id, level, texts, period, "General")}
            onEditComment={(id, text) => data.editComment(id, text)}
            onDeleteComment={(id) => data.deleteComment(id)}
            onAddSkill={() => {}}
            onDeleteSkill={() => {}}
            skillTabs={[]}
            activeSkill="General"
            onSwitchSkill={() => {}}
          />
        </CardContent>
      </Card>

      {showShare && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end">
          <div className="bg-card w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-muted">
              <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                <Globe className="w-5 h-5" /> Share with All Subjects
              </h2>
              <button onClick={() => setShowShare(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <p className="text-sm text-muted-foreground">
                Sends the {period} Attitude to Learning and Homework comments to every subject, for each progress
                report you tick. Existing comments in those two categories are replaced, so nothing is duplicated.
              </p>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer bg-muted/50">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => setTargets(allSelected ? [] : [...PROGRESS_PERIODS])}
                />
                <span className="font-bold text-sm">All progress reports</span>
              </label>
              {PROGRESS_PERIODS.map(p => (
                <label key={p} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                  <Checkbox checked={targets.includes(p)} onCheckedChange={() => toggle(p)} />
                  <span className="font-bold text-sm">{p}</span>
                </label>
              ))}
            </div>
            <div className="p-6 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowShare(false)} disabled={sharing}>Cancel</Button>
              <Button className="flex-1" onClick={handleShare} disabled={sharing || targets.length === 0}>
                {sharing ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
