"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Slider } from "@heroui/slider";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner";
import { SimpleVideoGenerator, getBackgroundImages, downloadVideo } from "@/lib/simpleVideoGenerator";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<ArrayBuffer | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>('video/webm');
  const [logoSize, setLogoSize] = useState<number>(8);
  const [enableVariations, setEnableVariations] = useState<boolean>(true);
  const [currentBgIndex, setCurrentBgIndex] = useState<number>(0);
  const [showingVideo, setShowingVideo] = useState<boolean>(false);
  const videoGeneratorRef = useRef<SimpleVideoGenerator | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logoSizeRef = useRef<number>(logoSize);
  const enableVariationsRef = useRef<boolean>(enableVariations);

  // Keep refs in sync with state for real-time preview
  useEffect(() => {
    logoSizeRef.current = logoSize;
  }, [logoSize]);

  useEffect(() => {
    enableVariationsRef.current = enableVariations;
  }, [enableVariations]);

  // Cleanup video preview URL when component unmounts or when new video is generated
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleFileUpload = (file: File) => {
    if (file && (file.type.startsWith("image/") || file.type === "image/svg+xml")) {
      setUploadedFile(file);
      setShowingVideo(false);
      setGeneratedVideo(null);
      setVideoPreviewUrl(null);
      startPreview(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Start live preview
  const startPreview = (file: File) => {
    stopPreview();
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    previewCanvasRef.current = canvas;

    const ctx = canvas.getContext('2d')!;
    const backgroundImages = getBackgroundImages();

    // Load logo
    const logoImg = new Image();
    logoImg.onload = () => {
      let frameCount = 0;

      const renderFrame = () => {
        // Change background every 15 frames (about every 0.5 seconds at 30fps)
        const bgIndex = Math.floor(frameCount / 15) % backgroundImages.length;
        setCurrentBgIndex(bgIndex);

        const bgImg = new Image();
        bgImg.onload = () => {
          // Clear and draw background
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

          // Draw logo with current settings
          drawLogoOnCanvasRealtime(ctx, logoImg, canvas.width, canvas.height, frameCount);

          // Copy to display canvas
          if (displayCanvasRef.current) {
            const displayCtx = displayCanvasRef.current.getContext('2d');
            if (displayCtx) {
              displayCanvasRef.current.width = canvas.width;
              displayCanvasRef.current.height = canvas.height;
              displayCtx.drawImage(canvas, 0, 0);
            }
          }
        };
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = backgroundImages[bgIndex];

        frameCount++;
      };

      previewIntervalRef.current = setInterval(renderFrame, 33); // ~30fps
    };
    logoImg.src = URL.createObjectURL(file);
  };

  const stopPreview = () => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  };

  const drawLogoOnCanvas = (ctx: CanvasRenderingContext2D, logoImg: HTMLImageElement, canvasWidth: number, canvasHeight: number, size: number, variations: boolean, frameCount: number) => {
    const baseScale = size / 100;

    let scaleVariation = 1;
    let rotationAngle = 0;
    let positionOffsetX = 0;
    let positionOffsetY = 0;

    if (variations) {
      // Use frameCount to create predictable but varied effects that sync with background changes
      const variationSeed = Math.floor(frameCount / 15); // Same as background change interval

      // Create pseudo-random but consistent variations based on background index
      scaleVariation = 1 + (Math.sin(variationSeed * 2.1) * 0.15); // ±15% size variation
      rotationAngle = Math.sin(variationSeed * 1.7) * 5; // ±5 degrees rotation
      positionOffsetX = Math.sin(variationSeed * 1.3) * 10; // ±10px horizontal offset
      positionOffsetY = Math.cos(variationSeed * 1.9) * 10; // ±10px vertical offset
    }

    const logoScale = baseScale * scaleVariation;
    const logoWidth = logoImg.width * logoScale;
    const logoHeight = logoImg.height * logoScale;
    const logoX = (canvasWidth - logoWidth) / 2 + positionOffsetX;
    const logoY = (canvasHeight - logoHeight) / 2 + positionOffsetY;

    ctx.save();
    ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
    ctx.rotate(rotationAngle * Math.PI / 180);

    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.drawImage(logoImg, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
    ctx.restore();
  };

  // Real-time version that reads current state
  const drawLogoOnCanvasRealtime = (ctx: CanvasRenderingContext2D, logoImg: HTMLImageElement, canvasWidth: number, canvasHeight: number, frameCount: number) => {
    const baseScale = logoSizeRef.current / 100; // Read current state from ref

    let scaleVariation = 1;
    let rotationAngle = 0;
    let positionOffsetX = 0;
    let positionOffsetY = 0;

    if (enableVariationsRef.current) { // Read current state from ref
      // Use frameCount to create predictable but varied effects that sync with background changes
      const variationSeed = Math.floor(frameCount / 15); // Same as background change interval

      // Create pseudo-random but consistent variations based on background index
      scaleVariation = 1 + (Math.sin(variationSeed * 2.1) * 0.15); // ±15% size variation
      rotationAngle = Math.sin(variationSeed * 1.7) * 5; // ±5 degrees rotation
      positionOffsetX = Math.sin(variationSeed * 1.3) * 10; // ±10px horizontal offset
      positionOffsetY = Math.cos(variationSeed * 1.9) * 10; // ±10px vertical offset
    }

    const logoScale = baseScale * scaleVariation;
    const logoWidth = logoImg.width * logoScale;
    const logoHeight = logoImg.height * logoScale;
    const logoX = (canvasWidth - logoWidth) / 2 + positionOffsetX;
    const logoY = (canvasHeight - logoHeight) / 2 + positionOffsetY;

    ctx.save();
    ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
    ctx.rotate(rotationAngle * Math.PI / 180);

    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.drawImage(logoImg, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
    ctx.restore();
  };

  const generateVideo = async () => {
    if (!uploadedFile) return;

    stopPreview();
    setIsProcessing(true);
    setShowingVideo(true);
    setVideoReady(false);
    setProgress(0);

    try {
      // Initialize video generator if not already done
      if (!videoGeneratorRef.current) {
        videoGeneratorRef.current = new SimpleVideoGenerator();
      }

      const backgroundImages = getBackgroundImages();

      // Generate the video
      console.log('🎬 Starting video generation...');
      const videoBuffer = await videoGeneratorRef.current.generateVideo({
        logoFile: uploadedFile,
        backgroundImages,
        duration: 10,
        width: 640,
        height: 480,
        logoSize: logoSize,
        enableVariations: enableVariations,
        onProgress: (progressValue) => {
          setProgress(progressValue);
        }
      });

      setGeneratedVideo(videoBuffer);

      // Create preview URL
      const mimeType = 'video/webm';
      setVideoMimeType(mimeType);
      const blob = new Blob([videoBuffer], { type: mimeType });
      const previewUrl = URL.createObjectURL(blob);
      setVideoPreviewUrl(previewUrl);

      setIsProcessing(false);
      setVideoReady(true);
      setProgress(100);
    } catch (error) {
      console.error('Video generation failed:', error);
      setIsProcessing(false);
      setShowingVideo(false);
      startPreview(uploadedFile); // Resume preview
      alert(`Video generation failed: ${error.message}`);
    }
  };

  // Reset to preview when settings change
  const handleSettingsChange = () => {
    if (showingVideo && uploadedFile) {
      setShowingVideo(false);
      setGeneratedVideo(null);
      setVideoPreviewUrl(null);
      startPreview(uploadedFile);
    }
  };

  const regenerate = () => {
    generateVideo();
  };

  const resetToPreview = () => {
    setShowingVideo(false);
    setGeneratedVideo(null);
    setVideoPreviewUrl(null);
    setVideoReady(false);
    setProgress(0);
    if (uploadedFile) {
      startPreview(uploadedFile);
    }
  };

  const handleUploadNewLogo = () => {
    setUploadedFile(null);
    stopPreview();
    setShowingVideo(false);
    setGeneratedVideo(null);
    setVideoPreviewUrl(null);
    setVideoReady(false);
    setProgress(0);
  };

  const handleDownloadVideo = () => {
    if (generatedVideo) {
      downloadVideo(generatedVideo, `logoloop-${Date.now()}.webm`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

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
            <Card>
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Logo</h2>
                {!uploadedFile ? (
                  <div
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all ${
                      dragActive ? "border-blue-500 bg-blue-50 scale-105" : "hover:border-gray-400"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                  >
                    <div className="w-12 h-12 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload your logo</h3>
                    <p className="text-gray-500 mb-4">(PNG, SVG, JPG – transparent works best)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button
                        as="span"
                        color="primary"
                        className="cursor-pointer"
                      >
                        Choose File
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">Logo uploaded successfully</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      onClick={handleUploadNewLogo}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Settings Section */}
            {uploadedFile && (
              <Card>
                <CardBody className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>

                  <div className="space-y-6">
                    {/* Logo Size */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Logo Size: {logoSize}%
                      </label>
                      <Slider
                        size="md"
                        value={logoSize}
                        onChange={(value) => {
                          const newSize = Array.isArray(value) ? value[0] : value;
                          setLogoSize(newSize);
                        }}
                        min={2}
                        max={20}
                        step={1}
                        className="w-full"
                        color="primary"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Tiny</span>
                        <span>Large</span>
                      </div>
                    </div>

                    {/* Enable Variations */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">Animation Effects</p>
                        <p className="text-sm text-gray-500">Random wiggling and size changes</p>
                      </div>
                      <Switch
                        isSelected={enableVariations}
                        onValueChange={(value) => {
                          setEnableVariations(value);
                        }}
                        color="primary"
                      />
                    </div>

                    {/* Generate Button */}
                    <Button
                      color="primary"
                      size="lg"
                      className="w-full"
                      onClick={generateVideo}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Generating Video..." : "Generate Video"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
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
                    // Video generation/result view
                    <>
                      {isProcessing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Spinner size="lg" color="primary" className="mb-4" />
                          <p className="text-gray-600 mb-2">Generating your video...</p>
                          <Progress value={progress} className="w-3/4" color="primary" />
                          <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% complete</p>
                        </div>
                      ) : videoReady && videoPreviewUrl ? (
                        <video
                          controls
                          className="w-full h-full object-contain"
                          src={videoPreviewUrl}
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : null}
                    </>
                  ) : uploadedFile ? (
                    // Live preview
                    <div className="relative w-full h-full">
                      <canvas
                        ref={displayCanvasRef}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        Background {currentBgIndex + 1}/37
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p>Upload a logo to see preview</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {videoReady && !isProcessing && (
                  <div className="mt-4 space-y-3">
                    <Button
                      color="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleDownloadVideo}
                    >
                      Download Video (.webm)
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="bordered"
                        size="md"
                        onClick={resetToPreview}
                      >
                        Back to Preview
                      </Button>
                      <Button
                        variant="bordered"
                        size="md"
                        onClick={generateVideo}
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}
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
