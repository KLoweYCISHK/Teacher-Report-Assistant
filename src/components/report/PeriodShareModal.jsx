import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Share2, CalendarRange } from "lucide-react";
import { PROGRESS_PERIODS, getCategoryLabel } from "@/lib/constants";

export default function PeriodShareModal({ categoryId, sourcePeriod, onClose, onConfirm }) {
  const [selected, setSelected] = useState([]);
  const targets = PROGRESS_PERIODS.filter(p => p !== sourcePeriod);
  const allSelected = targets.length > 0 && targets.every(p => selected.includes(p));

  const toggle = (p) => setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleAll = () => setSelected(allSelected ? [] : [...targets]);

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
            Copy your <strong>{sourcePeriod}</strong> {displayCat} comments to other progress reports.
            Existing {displayCat} comments in the selected reports will be replaced.
          </p>

          <div className="flex justify-between items-end mb-2">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <CalendarRange className="w-4 h-4" /> Select Progress Reports
            </label>
            {targets.length > 1 && (
              <button onClick={toggleAll} className="text-xs font-bold text-accent hover:underline">
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {targets.map(p => (
              <label
                key={p}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selected.includes(p) ? "bg-accent/10 border-accent" : "bg-card hover:bg-muted"
                }`}
              >
                <Checkbox checked={selected.includes(p)} onCheckedChange={() => toggle(p)} />
                <span className={`font-medium text-sm ${selected.includes(p) ? "text-primary" : "text-muted-foreground"}`}>
                  {p}
                </span>
              </label>
            ))}
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
