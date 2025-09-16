"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import LogoUpload from "@/components/LogoUpload";
import SettingsPanel from "@/components/SettingsPanel";
import PreviewCanvas from "@/components/PreviewCanvas";
import VideoPlayer from "@/components/VideoPlayer";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [logoSize, setLogoSize] = useState<number>(8);
  const [enableVariations, setEnableVariations] = useState<boolean>(true);

  const {
    isProcessing,
    videoReady,
    progress,
    videoPreviewUrl,
    showingVideo,
    generateVideo,
    resetToPreview,
    handleDownloadVideo
  } = useVideoGeneration();

  const handleFileUpload = (file: File) => {
    if (file && (file.type.startsWith("image/") || file.type === "image/svg+xml")) {
      setUploadedFile(file);
      resetToPreview(); // Reset any existing video state
    }
  };

  const handleUploadNewLogo = () => {
    setUploadedFile(null);
    resetToPreview();
  };

  const handleGenerateVideo = async () => {
    if (!uploadedFile) return;

    try {
      await generateVideo(uploadedFile, logoSize, enableVariations);
    } catch (error: any) {
      alert(`Video generation failed: ${error.message}`);
    }
  };

  const handleRegenerate = () => {
    handleGenerateVideo();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">LogoLoop</h1>
        <p className="text-lg text-gray-600">Your logo. Infinite backgrounds.</p>
      </div>

      {/* Main Layout - 2 Columns */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <LogoUpload
              uploadedFile={uploadedFile}
              onFileUpload={handleFileUpload}
              onUploadNewLogo={handleUploadNewLogo}
            />

            {/* Settings Section */}
            {uploadedFile && (
              <SettingsPanel
                logoSize={logoSize}
                enableVariations={enableVariations}
                isProcessing={isProcessing}
                onLogoSizeChange={setLogoSize}
                onVariationsChange={setEnableVariations}
                onGenerateVideo={handleGenerateVideo}
              />
            )}
          </div>

          {/* Right Column - Preview/Video */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {showingVideo ? (isProcessing ? "Generating..." : "Your Video") : "Live Preview"}
                </h2>

                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                  {showingVideo ? (
                    <VideoPlayer
                      isProcessing={isProcessing}
                      progress={progress}
                      videoReady={videoReady}
                      videoPreviewUrl={videoPreviewUrl}
                      onDownload={handleDownloadVideo}
                      onResetToPreview={resetToPreview}
                      onRegenerate={handleRegenerate}
                    />
                  ) : (
                    <PreviewCanvas
                      logoFile={uploadedFile}
                      logoSize={logoSize}
                      enableVariations={enableVariations}
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-500">
        Made with ❤️ by <span className="font-semibold text-gray-700">LogoLoop</span> — free experiment
      </div>
    </div>
  );
}