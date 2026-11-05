import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, LogOut, FileText } from "lucide-react";
import CommentCategory from "./CommentCategory.jsx";
import { PROGRESS_PERIODS, ADMIN_CATEGORIES, ADMIN_SUBJECT_ID, getTabList } from "@/lib/constants";

export default function AdminPanel({ data, onExit }) {
  const [period, setPeriod] = useState(PROGRESS_PERIODS[0]);
  const [catIndex, setCatIndex] = useState(0);
  const [activeTabs, setActiveTabs] = useState({});

  const category = ADMIN_CATEGORIES[catIndex];
  const tabs = getTabList(category.id, data.adminTabs?.[category.id] || []);
  const activeTab = activeTabs[category.id] || "General";

  const comments = data.comments.filter(c =>
    c.subject_id === ADMIN_SUBJECT_ID && c.category === category.id && c.period === period
  );

  const handleAddTab = async (name) => {
    const custom = (data.adminTabs?.[category.id] || []).filter(t => t !== "General");
    if (name === "General" || custom.includes(name)) return;
    await data.setAdminTabs(category.id, [...custom, name]);
  };

  const handleDeleteTab = async (name) => {
    if (!confirm(`Remove the "${name}" tab? Its comments stay saved but will be hidden.`)) return;
    const custom = (data.adminTabs?.[category.id] || []).filter(t => t !== name);
    await data.setAdminTabs(category.id, custom);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5 pb-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" /> Admin: PLT Generated Comments
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
              <FileText className="w-5 h-5 text-accent" /> PLT {category.label} · {period}
            </CardTitle>
            <p className="text-xs text-muted-foreground max-w-md">
              Subjects pull these in with the "PLT Generated Comments" button on their subject page.
            </p>
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
              data.addComment(ADMIN_SUBJECT_ID, category.id, level, text, period, activeTab)}
            onBulkAddComments={(level, texts) =>
              data.bulkAddComments(ADMIN_SUBJECT_ID, category.id, level, texts, period, activeTab)}
            onEditComment={(id, text) => data.editComment(id, text)}
            onDeleteComment={(id) => data.deleteComment(id)}
            onAddSkill={handleAddTab}
            onDeleteSkill={handleDeleteTab}
            skillTabs={tabs}
            activeSkill={activeTab}
            onSwitchSkill={(t) => setActiveTabs(prev => ({ ...prev, [category.id]: t }))}
          />
        </CardContent>
      </Card>

    </div>
  );
}
