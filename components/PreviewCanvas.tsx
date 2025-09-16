"use client";

import { usePreview } from "@/hooks/usePreview";

interface PreviewCanvasProps {
  logoFile: File | null;
  logoSize: number;
  enableVariations: boolean;
}

export default function PreviewCanvas({ logoFile, logoSize, enableVariations }: PreviewCanvasProps) {
  const { displayCanvasRef, currentBgIndex } = usePreview({
    logoFile,
    logoSize,
    enableVariations,
    isActive: true
  });

  if (!logoFile) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p>Upload a logo to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={displayCanvasRef}
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        Background {currentBgIndex + 1}/37
      </div>
    </div>
  );
}