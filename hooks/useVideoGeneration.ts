"use client";

import { useState, useRef, useEffect } from "react";
import { SimpleVideoGenerator, getBackgroundImages, downloadVideo } from "@/lib/simpleVideoGenerator";

export function useVideoGeneration() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<ArrayBuffer | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [showingVideo, setShowingVideo] = useState<boolean>(false);

  const videoGeneratorRef = useRef<SimpleVideoGenerator | null>(null);

  // Cleanup video preview URL when component unmounts or when new video is generated
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const generateVideo = async (
    logoFile: File,
    logoSize: number,
    enableVariations: boolean,
    enableStickerBorder: boolean,
    speed: number = 50,
    aspectRatio: "16:9" | "9:16" | "1:1" = "16:9",
    customBackgrounds: File[] = []
  ) => {
    setIsProcessing(true);
    setShowingVideo(true);
    setVideoReady(false);
    setProgress(0);

    try {
      // Initialize video generator if not already done
      if (!videoGeneratorRef.current) {
        videoGeneratorRef.current = new SimpleVideoGenerator();
      }

      // Use custom backgrounds if provided, otherwise use defaults
      let backgroundImages: string[];
      if (customBackgrounds.length > 0) {
        backgroundImages = customBackgrounds.map(file => URL.createObjectURL(file));
      } else {
        backgroundImages = getBackgroundImages();
      }

      // Get dimensions based on aspect ratio
      const dimensions = {
        "16:9": { width: 1280, height: 720 },
        "9:16": { width: 720, height: 1280 },
        "1:1": { width: 1080, height: 1080 }
      }[aspectRatio];

      // Generate the video
      const videoBuffer = await videoGeneratorRef.current.generateVideo({
        logoFile,
        backgroundImages,
        duration: 10,
        width: dimensions.width,
        height: dimensions.height,
        logoSize: logoSize,
        enableVariations: enableVariations,
        enableStickerBorder: enableStickerBorder,
        speed: speed,
        onProgress: (progressValue) => {
          setProgress(progressValue);
        }
      });

      setGeneratedVideo(videoBuffer);

      // Create preview URL
      const mimeType = 'video/mp4';
      const blob = new Blob([videoBuffer], { type: mimeType });
      const previewUrl = URL.createObjectURL(blob);
      setVideoPreviewUrl(previewUrl);

      setIsProcessing(false);
      setVideoReady(true);
      setProgress(100);
    } catch (error: any) {
      console.error('Video generation failed:', error);
      setIsProcessing(false);
      setShowingVideo(false);
      throw error;
    }
  };

  const resetToPreview = () => {
    setShowingVideo(false);
    setGeneratedVideo(null);
    setVideoPreviewUrl(null);
    setVideoReady(false);
    setProgress(0);
  };

  const handleDownloadVideo = () => {
    if (generatedVideo) {
      downloadVideo(generatedVideo, `logoloop-${Date.now()}.mp4`);
    }
  };

  return {
    isProcessing,
    videoReady,
    progress,
    videoPreviewUrl,
    showingVideo,
    generateVideo,
    resetToPreview,
    handleDownloadVideo
  };
}