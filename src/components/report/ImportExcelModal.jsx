import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X, FileSpreadsheet, Upload } from "lucide-react";
import { readWorkbook, readSheet } from "@/lib/importCommentBank";
import ImportFormatGuide from "./ImportFormatGuide.jsx";

const TARGETS = [
  { id: "", label: "Don't import" },
  { id: "Assessment", label: "Performance based (1 & 2)" },
  { id: "Improvement", label: "Development" },
  { id: "HPL", label: "Attitude to Learning" },
  { id: "Homework", label: "Homework" },
];

export default function ImportExcelModal({ subjectName, reportPeriod, onClose, onConfirm }) {
  const [sheets, setSheets] = useState(null);
  const [fileName, setFileName] = useState("");
  const [targets, setTargets] = useState({});
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const read = await readWorkbook(f);
      setFileName(f.name);
      setSheets(read);
      setTargets(Object.fromEntries(read.map(s => [s.sheetName, s.guess || ""])));
    } catch (err) {
      console.error(err);
      alert("Could not read that file. Please choose an Excel (.xlsx) file.");
    } finally {
      setBusy(false);
    }
  };

  const plan = useMemo(() => (sheets || [])
    .filter(s => targets[s.sheetName])
    .map(s => ({ sheetName: s.sheetName, categoryId: targets[s.sheetName], ...readSheet(s.rows, targets[s.sheetName]) })),
  [sheets, targets]);

  const duplicateTarget = plan.length !== new Set(plan.map(p => p.categoryId)).size;
  const total = plan.reduce((n, p) => n + p.comments.length, 0);

  const handleImport = async () => {
    if (duplicateTarget) { alert("Two sheets are set to the same category. Choose a different one for each."); return; }
    setBusy(true);
    const ok = await onConfirm(plan);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end">
      <div className="bg-card w-full max-w-lg h-full shadow-2xl flex flex-col animate-in">
        <div className="p-6 border-b flex justify-between items-center bg-muted">
          <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Import from Excel
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          <p className="text-sm text-muted-foreground">
            Adds comments to <strong>{subjectName}</strong> for <strong>{reportPeriod}</strong>. Comments already in the bank are skipped.
          </p>

          <div className="bg-muted/60 border rounded-lg p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Required format</p>
            <ImportFormatGuide />
          </div>

          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-accent/40 rounded-lg p-5 cursor-pointer hover:bg-accent/5 text-sm font-bold text-accent">
            <Upload className="w-4 h-4" />
            {busy && !sheets ? "Reading…" : fileName ? `${fileName} — choose another` : "Choose Excel file (.xlsx)"}
            <input type="file" accept=".xlsx,.xls,.xlsm" className="hidden" onChange={handleFile} disabled={busy} />
          </label>

          {sheets?.map(s => {
            const p = plan.find(x => x.sheetName === s.sheetName);
            return (
              <div key={s.sheetName} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center gap-3">
                  <span className="font-bold text-primary">Sheet: {s.sheetName}</span>
                  <select
                    value={targets[s.sheetName] || ""}
                    onChange={(e) => setTargets(prev => ({ ...prev, [s.sheetName]: e.target.value }))}
                    className="border rounded-md px-2 py-1 text-sm bg-card"
                  >
                    {TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                {p ? (
                  <ul className="text-xs space-y-1">
                    {p.tabs.map(tab => (
                      <li key={tab} className="flex justify-between border-b border-muted last:border-0 py-1">
                        <span>{tab}</span>
                        <span className="text-muted-foreground">{p.comments.filter(c => c.skill_tab === tab).length} comments</span>
                      </li>
                    ))}
                    {p.tabs.length === 0 && <li className="text-muted-foreground">No comments found on this sheet.</li>}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">This sheet won't be imported.</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t bg-muted flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleImport} disabled={busy || total === 0}>
            {busy && sheets ? "Importing…" : `Import ${total} comments`}
          </Button>
        </div>
      </div>
    </div>
  );
}
