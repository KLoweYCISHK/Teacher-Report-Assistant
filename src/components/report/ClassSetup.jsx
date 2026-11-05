import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  BookOpen, Calendar, Users, Plus, Trash2, ArrowRight,
  Briefcase, Filter, FileText, Check, Upload, Sparkles, X
} from "lucide-react";
import { REPORT_PERIODS, OPTIONAL_CATEGORIES, STANDARD_CATEGORIES, REQUIRED_CATEGORY_IDS } from "@/lib/constants";


export default function ClassSetup({
  departments, subjects, selectedDept, setSelectedDept,
  selectedSubject, setSelectedSubject,
  reportPeriod, setReportPeriod,
  onStartClass, onAddSubject, onDeleteSubject,
  onAddDepartment, onDeleteDepartment,
  onUpdateMockTitle,
  onApplyPlt,
}) {
  const [showPlt, setShowPlt] = useState(false);
  const [pltTargets, setPltTargets] = useState([]);
  const [pltBusy, setPltBusy] = useState(false);
  const [namesInput, setNamesInput] = useState("");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectType, setNewSubjectType] = useState("full");
  const [selectedOptionals, setSelectedOptionals] = useState({ HPL: false, Homework: false });
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setSelectedOptionals({ HPL: false, Homework: false });
  }, [selectedSubject?.id]);

  const filteredSubjects = subjects.filter(s => s.department_id === selectedDept?.id);
  const isSharedStyle = selectedSubject?.report_type === "shared";
  const showSharedConfig = isSharedStyle && reportPeriod !== "Mocks";
  const hasSelectedOptional = Object.values(selectedOptionals).some(v => v);

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Read the TermGrades export in the browser: C = Last Name, D = First Name,
      // F = Preferred Name, H = Final Grade.
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const cell = (row, i) => String(row[i] ?? "").trim();

      const students = rows
        .filter(r => cell(r, 2) && cell(r, 2).toLowerCase() !== "last name")
        .map(r => {
          const name = [cell(r, 2), cell(r, 3)].filter(Boolean).join(" ") || cell(r, 5);
          const grade = cell(r, 7);
          return grade ? `${name}, ${grade}` : name;
        })
        .filter(Boolean);

      if (students.length > 0) {
        setNamesInput(prev => (prev.trim() ? prev + "\n" + students.join("\n") : students.join("\n")));
        alert(`Successfully imported ${students.length} students!`);
      } else {
        alert("Could not find student names in the file. Names should be in columns C and D.");
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed: " + error.message);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const handleStart = () => {
    const students = namesInput.split("\n").map(s => s.trim()).filter(s => s.length > 0);
    if (students.length === 0) return;

    let finalCategories = [];

    if (reportPeriod === "Mocks") {
      const titles = selectedSubject?.mock_titles || ["", "", "", "", ""];
      finalCategories = titles.map((t, i) => ({
        id: `Mock${i + 1}`,
        label: t.trim() || `Mock Category ${i + 1}`,
      }));
    } else if (isSharedStyle) {
      finalCategories = STANDARD_CATEGORIES.filter(c =>
        REQUIRED_CATEGORY_IDS.includes(c.id) || selectedOptionals[c.id]
      );
    } else {
      finalCategories = [...STANDARD_CATEGORIES];
    }

    onStartClass(students, finalCategories);
  };

  const handleSaveSubject = () => {
    if (newSubjectName.trim() && selectedDept) {
      onAddSubject(newSubjectName.trim(), newSubjectType, selectedDept.id);
      setIsCreatingSubject(false);
      setNewSubjectName("");
      setNewSubjectType("full");
    }
  };

  const handleAddDept = () => {
    const name = prompt("Enter name for new department:");
    if (name && name.trim()) {
      if (departments.find(d => d.name === name.trim())) {
        alert("Department already exists.");
        return;
      }
      onAddDepartment(name.trim());
    }
  };

  const openPlt = () => {
    setPltTargets(selectedSubject ? [selectedSubject.id] : []);
    setShowPlt(true);
  };
  const togglePlt = (id) => setPltTargets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allPltSelected = filteredSubjects.length > 0 && filteredSubjects.every(s => pltTargets.includes(s.id));

  const handleApplyPlt = async () => {
    if (pltTargets.length === 0) return;
    if (!confirm(
      `Use the PLT Generated Attitude to Learning and Homework comments for ${pltTargets.length} subject${pltTargets.length === 1 ? "" : "s"}?\n\n` +
      "Any Attitude to Learning and Homework comments these subjects already have (all progress reports) will be replaced."
    )) return;
    setPltBusy(true);
    const ok = await onApplyPlt(pltTargets);
    setPltBusy(false);
    if (ok) setShowPlt(false);
  };

  const canStart = selectedSubject && namesInput.trim() && reportPeriod && (!showSharedConfig || hasSelectedOptional);

  return (
    <Card className="border-t-4 border-t-accent shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold">Class Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Step 1: Department */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-bold">
            <Briefcase className="w-4 h-4 text-accent" /> 1. Select Department
          </Label>
          <div className="flex gap-2">
            <Select
              value={selectedDept?.id || ""}
              onValueChange={(val) => {
                const dept = departments.find(d => d.id === val);
                setSelectedDept(dept);
                setSelectedSubject(null);
                setIsCreatingSubject(false);
              }}
            >
              <SelectTrigger className="flex-1"><SelectValue placeholder="Choose Department" /></SelectTrigger>
              <SelectContent>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleAddDept} title="Add department">
              <Plus className="w-4 h-4" />
            </Button>
            {selectedDept && (
              <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                if (confirm(`Delete department "${selectedDept.name}" and ALL its subjects?`)) {
                  onDeleteDepartment(selectedDept.id);
                  setSelectedDept(null);
                  setSelectedSubject(null);
                }
              }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Step 2: Subject */}
        <div className={`space-y-2 transition-opacity ${!selectedDept ? "opacity-40 pointer-events-none" : ""}`}>
          <Label className="flex items-center gap-2 text-sm font-bold">
            <BookOpen className="w-4 h-4 text-accent" /> 2. Select Report Group
          </Label>
          {isCreatingSubject ? (
            <div className="bg-accent/5 p-4 rounded-lg border border-accent/20 space-y-4">
              <Input
                autoFocus
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g. Year 8 Science"
              />
              <RadioGroup value={newSubjectType} onValueChange={setNewSubjectType} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="cursor-pointer">
                    <span className="font-bold">Full Report</span>
                    <span className="text-xs text-muted-foreground ml-1">(5 categories)</span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="shared" id="shared" />
                  <Label htmlFor="shared" className="cursor-pointer">
                    <span className="font-bold">Shared Report</span>
                    <span className="text-xs text-muted-foreground ml-1">(configurable)</span>
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsCreatingSubject(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveSubject}>Create Subject</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={selectedSubject?.id || ""}
                onValueChange={(val) => {
                  if (val === "__NEW__") {
                    setIsCreatingSubject(true);
                    setSelectedSubject(null);
                  } else {
                    setSelectedSubject(subjects.find(s => s.id === val));
                  }
                }}
              >
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select Report Group" /></SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  <SelectItem value="__NEW__" className="font-bold text-accent">+ Add New Subject...</SelectItem>
                </SelectContent>
              </Select>
              {selectedSubject && (
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                  if (confirm(`Permanently delete "${selectedSubject.name}"?`)) {
                    onDeleteSubject(selectedSubject.id);
                    setSelectedSubject(null);
                  }
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {selectedSubject && !isCreatingSubject && (
            <div className="flex items-center gap-3 flex-wrap pt-1">
              <Button variant="outline" size="sm" className="text-purple-700 text-xs" onClick={openPlt}>
                <Sparkles className="w-3 h-3 mr-1" />
                {selectedSubject.atl_source === "plt" ? "Update PLT Generated Comments" : "PLT Generated Comments"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedSubject.atl_source === "plt"
                  ? "This subject uses the PLT Attitude to Learning and Homework comments."
                  : "Use the PLT Attitude to Learning and Homework comments instead of writing your own."}
              </span>
            </div>
          )}
        </div>

        {showPlt && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end">
            <div className="bg-card w-full max-w-md h-full shadow-2xl flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-muted">
                <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> PLT Generated Comments
                </h2>
                <button onClick={() => setShowPlt(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <p className="text-sm text-muted-foreground">
                  Adds the PLT Attitude to Learning and Homework comments (every progress report, with their tabs) to the
                  {" "}{selectedDept?.name} subjects you tick. Their existing comments in those two categories are replaced.
                </p>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Select Subjects</span>
                  <button
                    onClick={() => setPltTargets(allPltSelected ? [] : filteredSubjects.map(s => s.id))}
                    className="text-xs font-bold text-accent hover:underline"
                  >
                    {allPltSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="space-y-2">
                  {filteredSubjects.map(s => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        pltTargets.includes(s.id) ? "bg-accent/10 border-accent" : "bg-card hover:bg-muted"
                      }`}
                    >
                      <Checkbox checked={pltTargets.includes(s.id)} onCheckedChange={() => togglePlt(s.id)} />
                      <span className="font-medium text-sm flex-1">{s.name}</span>
                      {s.atl_source === "plt" && (
                        <span className="text-[10px] font-bold uppercase text-purple-700">PLT</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowPlt(false)} disabled={pltBusy}>Cancel</Button>
                <Button className="flex-1" onClick={handleApplyPlt} disabled={pltBusy || pltTargets.length === 0}>
                  {pltBusy ? "Adding..." : `Add to ${pltTargets.length} subject${pltTargets.length === 1 ? "" : "s"}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Report Period */}
        <div className={`space-y-3 transition-opacity ${!selectedSubject ? "opacity-40 pointer-events-none" : ""}`}>
          <Label className="flex items-center gap-2 text-sm font-bold">
            <Calendar className="w-4 h-4 text-accent" /> 3. Select Report Period
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {REPORT_PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setReportPeriod(p)}
                className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                  reportPeriod === p
                    ? "border-accent bg-accent text-accent-foreground shadow-md"
                    : "border-border bg-card text-muted-foreground hover:border-accent/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {reportPeriod === "Mocks" && selectedSubject && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-destructive" />
                <h3 className="font-bold">Mock Exam Categories</h3>
              </div>
              <p className="text-sm text-muted-foreground">Define your marking criteria categories below.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[0, 1, 2, 3, 4].map(idx => (
                  <Input
                    key={idx}
                    value={selectedSubject.mock_titles?.[idx] || ""}
                    onChange={(e) => onUpdateMockTitle(selectedSubject.id, idx, e.target.value)}
                    placeholder={`Category ${idx + 1} Name`}
                    className="border-destructive/20"
                  />
                ))}
              </div>
            </div>
          )}

          {showSharedConfig && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-accent" />
                <h3 className="font-bold">Configure Categories</h3>
              </div>
              <p className="text-sm text-muted-foreground">Both Performance based categories and Development are compulsory. Select at least one optional.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STANDARD_CATEGORIES.filter(c => REQUIRED_CATEGORY_IDS.includes(c.id)).map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg opacity-70 cursor-not-allowed">
                    <Check className="w-4 h-4 text-accent" />
                    <span className="font-bold text-sm">{c.label} (Required)</span>
                  </div>
                ))}
                {OPTIONAL_CATEGORIES.map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedOptionals[opt.id] ? "bg-card border-accent shadow-sm" : "bg-muted/50 border-transparent hover:bg-card"
                    }`}
                  >
                    <Checkbox
                      checked={selectedOptionals[opt.id]}
                      onCheckedChange={(val) => setSelectedOptionals(prev => ({ ...prev, [opt.id]: val }))}
                    />
                    <span className={`font-bold text-sm ${selectedOptionals[opt.id] ? "text-foreground" : "text-muted-foreground"}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>



        {/* Step 4: Students */}
        <div className={`space-y-2 transition-opacity ${!selectedSubject ? "opacity-40 pointer-events-none" : ""}`}>
          <Label className="flex items-center gap-2 text-sm font-bold">
            <Users className="w-4 h-4 text-accent" /> 4. Enter Student Names
          </Label>
          <p className="text-xs text-muted-foreground">One name per line. These are stored only in your browser session.</p>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Student Name, Final Grade (optional)</p>
            <Textarea
              value={namesInput}
              onChange={(e) => setNamesInput(e.target.value)}
              placeholder={"Alice Smith, A\nBob Jones, B\nCharlie Brown, C"}
              className="h-48 font-mono text-sm"
            />
          </div>
        </div>

        <Button
          size="lg"
          className="w-full font-bold text-lg h-14"
          onClick={handleStart}
          disabled={!canStart}
        >
          {showSharedConfig && !hasSelectedOptional
            ? "Select at least 1 optional category"
            : <>Start Report Cycle <ArrowRight className="w-5 h-5 ml-2" /></>
          }
        </Button>
      </CardContent>
    </Card>
  );
}
