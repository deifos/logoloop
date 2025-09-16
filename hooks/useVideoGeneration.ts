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
    enableVariations: boolean
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

      const backgroundImages = getBackgroundImages();

      // Generate the video
      console.log('🎬 Starting video generation...');
      const videoBuffer = await videoGeneratorRef.current.generateVideo({
        logoFile,
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
      downloadVideo(generatedVideo, `logoloop-${Date.now()}.webm`);
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