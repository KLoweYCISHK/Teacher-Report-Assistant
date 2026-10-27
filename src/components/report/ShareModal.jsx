import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Share2, Briefcase } from "lucide-react";
import { getCategoryLabel } from "@/lib/constants";

export default function ShareModal({
  categoryId,
  currentSubjectId,
  subjects,
  departments,
  onClose,
  onConfirm,
}) {
  const [selected, setSelected] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");

  const currentSubject = subjects.find(s => s.id === currentSubjectId);
  const availableSubjects = subjects.filter(s => s.id !== currentSubjectId);

  useEffect(() => {
    if (currentSubject && departments.length > 0) {
      setSelectedDeptId(currentSubject.department_id);
    } else if (departments.length > 0) {
      setSelectedDeptId(departments[0].id);
    }
  }, [currentSubjectId, departments]);

  const displayedSubjects = availableSubjects.filter(s => s.department_id === selectedDeptId);
  const allDisplayedSelected = displayedSubjects.length > 0 && displayedSubjects.every(s => selected.includes(s.id));

  const toggleAll = () => {
    if (allDisplayedSelected) {
      setSelected(selected.filter(id => !displayedSubjects.find(s => s.id === id)));
    } else {
      const ids = displayedSubjects.map(s => s.id);
      setSelected(Array.from(new Set([...selected, ...ids])));
    }
  };

  const toggleSubject = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const displayCat = getCategoryLabel(categoryId);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end">
      <div className="bg-card w-full max-w-md h-full shadow-2xl flex flex-col animate-in">
        <div className="p-6 border-b flex justify-between items-center bg-muted">
          <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <Share2 className="w-5 h-5" /> Share {displayCat}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-6">
            Select subjects to share your <strong>{displayCat}</strong> comments and custom tabs with.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Choose Department
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {selectedDeptId && (
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Select Subjects</label>
                  {displayedSubjects.length > 0 && (
                    <button onClick={toggleAll} className="text-xs font-bold text-accent hover:underline">
                      {allDisplayedSelected ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {displayedSubjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">No other subjects in this department.</p>
                  ) : (
                    displayedSubjects.map(s => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selected.includes(s.id) ? "bg-accent/10 border-accent" : "bg-card hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          checked={selected.includes(s.id)}
                          onCheckedChange={() => toggleSubject(s.id)}
                        />
                        <span className={`font-medium text-sm ${selected.includes(s.id) ? "text-primary" : "text-muted-foreground"}`}>
                          {s.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-muted flex justify-between items-center">
          <Badge variant="secondary" className="text-sm font-bold">{selected.length} Selected</Badge>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onConfirm(selected)} disabled={selected.length === 0}>
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
