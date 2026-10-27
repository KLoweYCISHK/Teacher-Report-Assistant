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
                <img
                  src={`${import.meta.env.BASE_URL}ycis-logo.svg`}
                  alt="YCIS logo"
                  className="h-14 w-14 object-contain bg-white rounded-xl p-1"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {isUploading ? "Uploading..." : "Click to change logo"}
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
