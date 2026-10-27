import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle, Copy, Check } from "lucide-react";

export default function ResultPanel({ prompt, onStartOver }) {
  const [copiedName, setCopiedName] = useState(null);

  const studentBlocks = prompt
    .split(/\n---+\n/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      const name = lines[0] || "";
      const comments = lines.slice(1);
      return { name, comments };
    });

  const handleCopy = (name, comments) => {
    const text = comments.map(c => `• ${c}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedName(name);
      setTimeout(() => setCopiedName(null), 2000);
    });
  };

  const handleDownload = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Class Reports</title></head><body>";
    const footer = "</body></html>";
    const htmlContent = studentBlocks.map(({ name, comments }) =>
      `<h3>${name}</h3><ul>${comments.map(c => `<li>${c}</li>`).join("")}</ul><br/>`
    ).join("<hr/>");
    const source = "data:application/vnd.ms-word;charset=utf-8," + encodeURIComponent(header + htmlContent + footer);
    const a = document.createElement("a");
    a.href = source;
    a.download = "Class_Reports.doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-2xl font-extrabold text-green-800">Reports Generated!</h2>
        <p className="text-green-700 mt-2">All student reports have been compiled. Copy each report below.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleDownload} className="bg-accent hover:bg-accent/90">
          <Download className="w-4 h-4 mr-2" /> Download Word Doc
        </Button>
      </div>

      <div className="space-y-4">
        {studentBlocks.map(({ name, comments }) => (
          <Card key={name} className="shadow-sm">
            <CardHeader className="bg-muted/40 border-b py-3 px-5 flex flex-row justify-between items-center">
              <CardTitle className="text-base font-bold">{name}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs ${copiedName === name ? "text-green-700 border-green-300 bg-green-50" : "text-accent border-accent/30"}`}
                onClick={() => handleCopy(name, comments)}
              >
                {copiedName === name
                  ? <><Check className="w-3 h-3 mr-1" /> Copied!</>
                  : <><Copy className="w-3 h-3 mr-1" /> Copy Report</>}
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {comments.length > 0 ? (
                <ul className="list-disc list-outside pl-5 space-y-1.5 text-sm leading-relaxed">
                  {comments.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              ) : (
                <p className="text-muted-foreground italic text-sm">No comments recorded.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onStartOver}
          className="text-muted-foreground hover:text-foreground underline text-sm"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
