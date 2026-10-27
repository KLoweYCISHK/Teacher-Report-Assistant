import React, { useState } from "react";
import { X } from "lucide-react";

// Shrink the logo to a small PNG data URL so it can live in Firestore (no Storage bucket needed).
function fileToSmallDataUrl(file, size = 160) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Header({ logoUrl, onSetLogo }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await onSetLogo(await fileToSmallDataUrl(file));
    } catch (error) {
      console.error("Failed to upload logo:", error);
      alert("Could not save the logo. Please try a different image.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await onSetLogo(null);
    } catch (error) {
      console.error("Failed to remove logo:", error);
    }
  };

  return (
    <div className="bg-primary text-primary-foreground pt-8 pb-16 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {logoUrl ? (
              <>
                <img src={logoUrl} alt="School Logo" className="h-14 w-14 object-cover bg-white rounded-xl" />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove logo"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer group relative">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                    <path d="M8 7h6"/>
                    <path d="M8 11h8"/>
                  </svg>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {isUploading ? "Uploading..." : "Click to add logo"}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Teacher Report Assistant</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
