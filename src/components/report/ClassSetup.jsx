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
  Briefcase, Filter, FileText, Check, Upload
} from "lucide-react";
import { REPORT_PERIODS, OPTIONAL_CATEGORIES } from "@/lib/constants";


export default function ClassSetup({
  departments, subjects, selectedDept, setSelectedDept,
  selectedSubject, setSelectedSubject,
  reportPeriod, setReportPeriod,
  onStartClass, onAddSubject, onDeleteSubject,
  onAddDepartment, onDeleteDepartment,
  onUpdateMockTitle,
}) {
  const [namesInput, setNamesInput] = useState("");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectType, setNewSubjectType] = useState("full");
  const [selectedOptionals, setSelectedOptionals] = useState({ HPL: false, Language: false, Homework: false });
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setSelectedOptionals({ HPL: false, Language: false, Homework: false });
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
      finalCategories.push({ id: "Assessment", label: "Assessment" });
      if (selectedOptionals.HPL) finalCategories.push({ id: "HPL", label: "Approaches to Learning" });
      if (selectedOptionals.Language) finalCategories.push({ id: "Language", label: "Language" });
      if (selectedOptionals.Homework) finalCategories.push({ id: "Homework", label: "Homework" });
      finalCategories.push({ id: "Improvement", label: "Improvement" });
    } else {
      finalCategories = [
        { id: "HPL", label: "Approaches to Learning" },
        { id: "Language", label: "Language" },
        { id: "Assessment", label: "Assessment" },
        { id: "Homework", label: "Homework" },
        { id: "Improvement", label: "Improvement" },
      ];
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
        </div>

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
              <p className="text-sm text-muted-foreground">Assessment and Improvement are compulsory. Select at least one optional.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg opacity-70 cursor-not-allowed">
                  <Check className="w-4 h-4 text-accent" />
                  <span className="font-bold text-sm">Assessment (Required)</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg opacity-70 cursor-not-allowed">
                  <Check className="w-4 h-4 text-accent" />
                  <span className="font-bold text-sm">Improvement (Required)</span>
                </div>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => document.getElementById('excel-import-input')?.click()}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4" />
              {isImporting ? "Importing..." : "Import from Excel"}
            </Button>
            <input
              id="excel-import-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileImport}
              className="hidden"
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
