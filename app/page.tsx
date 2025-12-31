"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import LogoUpload from "@/components/LogoUpload";
import SettingsPanel from "@/components/SettingsPanel";
import PreviewCanvas from "@/components/PreviewCanvas";
import VideoPlayer from "@/components/VideoPlayer";
import BackgroundUpload from "@/components/BackgroundUpload";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [logoSize, setLogoSize] = useState<number>(15);
  const [enableVariations, setEnableVariations] = useState<boolean>(true);
  const [enableStickerBorder, setEnableStickerBorder] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(50); // 1-100, 50 is default
  const [resizeMode, setResizeMode] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [customBackgrounds, setCustomBackgrounds] = useState<File[]>([]);

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
      await generateVideo(uploadedFile, logoSize, enableVariations, enableStickerBorder, speed, aspectRatio, customBackgrounds);
    } catch (error: any) {
      alert(`Video generation failed: ${error.message}`);
    }
  };

  const handleRegenerate = () => {
    handleGenerateVideo();
  };

  return (
    <div className="">
      {/* Main Layout - 3 Columns */}
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-4">
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
                speed={speed}
                enableVariations={enableVariations}
                enableStickerBorder={enableStickerBorder}
                resizeMode={resizeMode}
                aspectRatio={aspectRatio}
                isProcessing={isProcessing}
                onLogoSizeChange={setLogoSize}
                onSpeedChange={setSpeed}
                onVariationsChange={setEnableVariations}
                onStickerBorderChange={setEnableStickerBorder}
                onResizeModeChange={setResizeMode}
                onAspectRatioChange={setAspectRatio}
                onGenerateVideo={handleGenerateVideo}
              />
            )}
          </div>

          {/* Middle Column - Preview/Video */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardBody className="p-4">
                <div
                  className="bg-gray-100 rounded-lg overflow-hidden relative mx-auto"
                  style={{
                    aspectRatio: aspectRatio === "16:9" ? "16/9" : aspectRatio === "9:16" ? "9/16" : "1/1",
                    maxHeight: aspectRatio === "9:16" ? "60vh" : "auto"
                  }}
                >
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
                      speed={speed}
                      enableVariations={enableVariations}
                      enableStickerBorder={enableStickerBorder}
                      resizeMode={resizeMode}
                      aspectRatio={aspectRatio}
                      customBackgrounds={customBackgrounds}
                      onLogoSizeChange={setLogoSize}
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Backgrounds */}
          <div className="lg:col-span-1">
            {uploadedFile && (
              <BackgroundUpload
                backgrounds={customBackgrounds}
                onBackgroundsChange={setCustomBackgrounds}
              />
            )}
          </div>
        </div>
      </div>

     
    </div>
  );
}