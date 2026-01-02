"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/drawer";
import { useDisclosure } from "@heroui/use-disclosure";
import LogoUpload from "@/components/LogoUpload";
import SettingsPanel from "@/components/SettingsPanel";
import PreviewCanvas from "@/components/PreviewCanvas";
import VideoPlayer from "@/components/VideoPlayer";
import BackgroundUpload from "@/components/BackgroundUpload";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [logoSize, setLogoSize] = useState<number>(40);
  const [enableWiggle, setEnableWiggle] = useState<boolean>(true);
  const [enableRealisticEffect, setEnableRealisticEffect] =
    useState<boolean>(false);
  const [enableStickerBorder, setEnableStickerBorder] =
    useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(50); // 1-100, 50 is default
  const [resizeMode, setResizeMode] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">(
    "9:16",
  );
  const [customBackgrounds, setCustomBackgrounds] = useState<File[]>([]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Load default logo on mount
  useEffect(() => {
    const loadDefaultLogo = async () => {
      try {
        const response = await fetch("/logo.png");
        const blob = await response.blob();
        const file = new File([blob], "logo.png", { type: "image/png" });
        setUploadedFile(file);
      } catch (error) {
        // Default logo not found, that's okay
      }
    };
    loadDefaultLogo();
  }, []);

  const {
    isProcessing,
    videoReady,
    progress,
    videoPreviewUrl,
    showingVideo,
    generateVideo,
    resetToPreview,
    handleDownloadVideo,
  } = useVideoGeneration();

  const handleFileUpload = (file: File) => {
    if (
      file &&
      (file.type.startsWith("image/") || file.type === "image/svg+xml")
    ) {
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
      await generateVideo(
        uploadedFile,
        logoSize,
        enableWiggle,
        enableRealisticEffect,
        enableStickerBorder,
        speed,
        aspectRatio,
        customBackgrounds,
      );
    } catch (error: any) {
      alert(`Video generation failed: ${error.message}`);
    }
  };

  const handleRegenerate = () => {
    handleGenerateVideo();
  };

  // Settings panel props shared between desktop and mobile drawer
  const settingsPanelProps = {
    logoSize,
    speed,
    enableWiggle,
    enableRealisticEffect,
    enableStickerBorder,
    resizeMode,
    aspectRatio,
    isProcessing,
    onLogoSizeChange: setLogoSize,
    onSpeedChange: setSpeed,
    onWiggleChange: setEnableWiggle,
    onRealisticEffectChange: setEnableRealisticEffect,
    onStickerBorderChange: setEnableStickerBorder,
    onResizeModeChange: setResizeMode,
    onAspectRatioChange: setAspectRatio,
    onGenerateVideo: handleGenerateVideo,
  };

  return (
    <div className="">
      {/* Tagline */}
      <p className="text-center text-default-500 py-4">
        Your logo. Infinite backgrounds.
      </p>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto px-4 pb-6">
        {/* Mobile: Preview First, Desktop: 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Configuration (Hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            {/* Upload Section */}
            <LogoUpload
              uploadedFile={uploadedFile}
              onFileUpload={handleFileUpload}
              onUploadNewLogo={handleUploadNewLogo}
            />

            {/* Settings Section */}
            {uploadedFile && <SettingsPanel {...settingsPanelProps} />}
          </div>

          {/* Middle Column - Preview/Video (Shows first on mobile) */}
          <div className="order-first lg:order-none lg:col-span-2">
            <Card className="h-full">
              <CardBody className="p-4">
                <div
                  className="bg-gray-100 rounded-lg overflow-hidden relative mx-auto"
                  style={{
                    aspectRatio:
                      aspectRatio === "16:9"
                        ? "16/9"
                        : aspectRatio === "9:16"
                          ? "9/16"
                          : "1/1",
                    maxHeight: aspectRatio === "9:16" ? "55vh" : "auto",
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
                      enableWiggle={enableWiggle}
                      enableRealisticEffect={enableRealisticEffect}
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

            {/* Mobile Generate Button - shown below preview */}
            {uploadedFile && !showingVideo && (
              <Button
                color="primary"
                size="lg"
                className="w-full mt-4 lg:hidden"
                onPress={handleGenerateVideo}
                isDisabled={isProcessing}
              >
                {isProcessing ? "Generating..." : "Generate Video"}
              </Button>
            )}

            {/* Mobile Download Button - shown when video is ready */}
            {videoReady && !isProcessing && (
              <div className="mt-4 space-y-3 lg:hidden">
                <Button
                  color="primary"
                  size="lg"
                  className="w-full"
                  onPress={handleDownloadVideo}
                >
                  Download Video (.mp4)
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="md"
                    variant="bordered"
                    onPress={resetToPreview}
                  >
                    Back to Preview
                  </Button>
                  <Button
                    size="md"
                    variant="bordered"
                    onPress={handleRegenerate}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Backgrounds (Hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-1">
            {uploadedFile && (
              <BackgroundUpload
                backgrounds={customBackgrounds}
                onBackgroundsChange={setCustomBackgrounds}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <Button
        isIconOnly
        color="primary"
        size="lg"
        className="lg:hidden fixed bottom-6 right-6 z-50 shadow-lg rounded-full w-14 h-14"
        onPress={onOpen}
        aria-label="Open settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </Button>

      {/* Mobile Settings Drawer */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="bottom"
        size="lg"
      >
        <DrawerContent>
          {() => (
            <>
              <DrawerHeader className="flex flex-col gap-1">
                Settings
              </DrawerHeader>
              <DrawerBody className="pb-8">
                <div className="space-y-6">
                  {/* Logo Upload in Drawer */}
                  <LogoUpload
                    uploadedFile={uploadedFile}
                    onFileUpload={handleFileUpload}
                    onUploadNewLogo={handleUploadNewLogo}
                  />

                  {/* Settings in Drawer */}
                  {uploadedFile && (
                    <>
                      <SettingsPanel {...settingsPanelProps} />
                      <BackgroundUpload
                        backgrounds={customBackgrounds}
                        onBackgroundsChange={setCustomBackgrounds}
                      />
                    </>
                  )}
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
