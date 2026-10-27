import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, X } from "lucide-react";

export default function ActionPanel({ onBack, onNext, onReturnStart, isLastStep, disableNext }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-5xl mx-auto flex justify-between gap-4">
        <div className="flex gap-2">
          <Button variant="outline" className="text-destructive" onClick={onReturnStart}>
            <RotateCcw className="w-4 h-4 mr-2" /> Start Over
          </Button>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
        <Button
          onClick={onNext}
          disabled={disableNext}
          size="lg"
          className={`font-bold shadow-md ${
            disableNext ? "bg-muted text-muted-foreground" : isLastStep ? "bg-green-600 hover:bg-green-700 text-white" : ""
          }`}
        >
          {disableNext ? (
            <><X className="w-5 h-5 mr-2" /> Complete All Categories</>
          ) : isLastStep ? (
            <><CheckCircle className="w-5 h-5 mr-2" /> Finish & Generate</>
          ) : (
            <><ArrowRight className="w-5 h-5 mr-2" /> Next Student</>
          )}
        </Button>
      </div>
    </div>
  );
}
