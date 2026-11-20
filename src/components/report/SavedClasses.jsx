import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Trash2, Play, Lock } from "lucide-react";
import { loadSavedClasses, deleteSavedClass, countCompleted } from "@/lib/savedClasses";

// Classes this teacher has started on this browser, so they can carry on later
export default function SavedClasses({ onResume, disabled }) {
  const [list, setList] = useState(() => loadSavedClasses());
  if (list.length === 0) return null;

  const remove = (c) => {
    if (!confirm(`Delete the saved progress for "${c.name}"? This cannot be undone.`)) return;
    deleteSavedClass(c.id);
    setList(loadSavedClasses());
  };

  return (
    <Card className="mb-5 shadow-md">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-accent" /> Your saved classes
          </h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" /> Saved only in this browser on this device
          </span>
        </div>
        <div className="divide-y border rounded-lg">
          {list.map(c => {
            const done = countCompleted(c);
            const total = c.students?.length || 0;
            const finished = c.stepIndex >= total;
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="font-bold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.subjectName} · {c.reportPeriod} · {done} of {total} students done
                    {c.updatedAt && ` · last saved ${new Date(c.updatedAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onResume(c)} disabled={disabled} className="bg-accent hover:bg-accent/90 text-xs">
                    <Play className="w-3.5 h-3.5 mr-1" /> {finished ? "Open reports" : "Continue"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(c)} className="text-destructive text-xs" title="Delete saved class">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
