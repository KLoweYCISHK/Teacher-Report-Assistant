import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const HEADERS = ["Categories", "High Achieving", "Mid/High Achieving", "Mid/Low Achieving", "Under Achieving"];

// Builds and downloads a blank workbook in the right format
export async function downloadTemplate(chinese = false) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const perf = [
    HEADERS,
    ["AO1: Knowledge & Understanding", "High comment 1", "Mid/High comment 1", "Mid/Low comment 1", "Under comment 1"],
    ["AO1: Knowledge & Understanding", "High comment 2", "Mid/High comment 2", "Mid/Low comment 2", "Under comment 2"],
    ["AO2: Application & Analysis", "High comment 1", "Mid/High comment 1", "Mid/Low comment 1", "Under comment 1"],
  ];
  const dev = [
    HEADERS,
    ["AO1: Knowledge & Understanding", "To improve further, ...", "To improve, ...", "To improve, ...", "To improve, ..."],
    ["AO2: Application & Analysis", "To improve further, ...", "To improve, ...", "To improve, ...", "To improve, ..."],
  ];
  const FREQ = ["Categories", "Always", "Regularly", "Sometimes", "Rarely"];
  const atl = [
    FREQ,
    ["Self-Regulation", "Always comment 1", "Regularly comment 1", "Sometimes comment 1", "Rarely comment 1"],
    ["Participation", "Always comment 1", "Regularly comment 1", "Sometimes comment 1", "Rarely comment 1"],
  ];
  const hw = [
    FREQ,
    ["", "Always comment 1", "Regularly comment 1", "Sometimes comment 1", "Rarely comment 1"],
    ["", "Always comment 2", "Regularly comment 2", "Sometimes comment 2", "Rarely comment 2"],
  ];
  const firstSheets = chinese ? [["Reading", perf], ["Writing", perf]] : [["Performance based", perf]];
  [...firstSheets, ["Development", dev], ["ATL", atl], ["Homework", hw]].forEach(([name, rows]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 32 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, "Comment_Bank_Template.xlsx");
}

export default function ImportFormatGuide({ compact = false, isChinese = false }) {
  return (
    <div className="space-y-3 text-sm">
      <ol className="list-decimal pl-5 space-y-1 text-foreground">
        {isChinese
          ? <li>One Excel file (.xlsx) with sheets named <strong>Reading</strong>, <strong>Writing</strong> and <strong>Development</strong>. You can also add optional <strong>ATL</strong> (Attitude to Learning) and <strong>Homework</strong> sheets.</li>
          : <li>One Excel file (.xlsx) with sheets named <strong>Performance based</strong> and <strong>Development</strong>. You can also add optional <strong>ATL</strong> (Attitude to Learning) and <strong>Homework</strong> sheets.</li>}
        <li><strong>Row 1</strong> is headings: Categories | High Achieving | Mid/High Achieving | Mid/Low Achieving | Under Achieving. On the ATL and Homework sheets use Always | Regularly | Sometimes | Rarely.</li>
        <li><strong>Column A</strong> is the tab name. Rows with the same name all go into the same tab. A blank cell counts as the tab above. If column A is left empty, the comments go into one tab named after the category.</li>
        <li><strong>Columns B–E</strong> are the four levels. Each cell is one comment. Empty cells are fine.</li>
      </ol>
      {!compact && (
        <div className="overflow-x-auto">
          <table className="text-xs border border-border w-full bg-card">
            <thead className="bg-muted">
              <tr>
                {["", "A", "B", "C", "D", "E"].map(h => <th key={h} className="border px-2 py-1 text-muted-foreground">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold">
                <td className="border px-2 py-1 text-muted-foreground">1</td>
                {HEADERS.map(h => <td key={h} className="border px-2 py-1">{h}</td>)}
              </tr>
              {[["2", "AO1: Knowledge"], ["3", "AO1: Knowledge"], ["4", "AO2: Analysis"]].map(([n, tab]) => (
                <tr key={n}>
                  <td className="border px-2 py-1 text-muted-foreground">{n}</td>
                  <td className="border px-2 py-1 font-semibold">{tab}</td>
                  {[1, 2, 3, 4].map(i => <td key={i} className="border px-2 py-1 text-muted-foreground italic">comment…</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Button type="button" variant="outline" size="sm" className="text-green-700 border-green-300" onClick={() => downloadTemplate(isChinese)}>
        <Download className="w-3.5 h-3.5 mr-1" /> Download blank template
      </Button>
    </div>
  );
}
