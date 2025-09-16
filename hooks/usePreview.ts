"use client";

import { useRef, useEffect, useState } from "react";
import { getBackgroundImages } from "@/lib/simpleVideoGenerator";

interface UsePreviewOptions {
  logoFile: File | null;
  logoSize: number;
  enableVariations: boolean;
  isActive: boolean;
}

export function usePreview({ logoFile, logoSize, enableVariations, isActive }: UsePreviewOptions) {
  const [currentBgIndex, setCurrentBgIndex] = useState<number>(0);
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

  const drawLogoOnCanvas = (
    ctx: CanvasRenderingContext2D,
    logoImg: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    frameCount: number
  ) => {
    const baseScale = logoSizeRef.current / 100;

    let scaleVariation = 1;
    let rotationAngle = 0;
    let positionOffsetX = 0;
    let positionOffsetY = 0;

    if (enableVariationsRef.current) {
      const variationSeed = Math.floor(frameCount / 15);
      scaleVariation = 1 + (Math.sin(variationSeed * 2.1) * 0.15);
      rotationAngle = Math.sin(variationSeed * 1.7) * 5;
      positionOffsetX = Math.sin(variationSeed * 1.3) * 10;
      positionOffsetY = Math.cos(variationSeed * 1.9) * 10;
    }

    const logoScale = baseScale * scaleVariation;
    const logoWidth = logoImg.width * logoScale;
    const logoHeight = logoImg.height * logoScale;
    const logoX = (canvasWidth - logoWidth) / 2 + positionOffsetX;
    const logoY = (canvasHeight - logoHeight) / 2 + positionOffsetY;

    ctx.save();
    ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
    ctx.rotate(rotationAngle * Math.PI / 180);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.drawImage(logoImg, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
    ctx.restore();
  };

  const startPreview = (file: File) => {
    stopPreview();
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    previewCanvasRef.current = canvas;

    const ctx = canvas.getContext('2d')!;
    const backgroundImages = getBackgroundImages();

    const logoImg = new Image();
    logoImg.onload = () => {
      let frameCount = 0;

      const renderFrame = () => {
        const bgIndex = Math.floor(frameCount / 15) % backgroundImages.length;
        setCurrentBgIndex(bgIndex);

        const bgImg = new Image();
        bgImg.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

          drawLogoOnCanvas(ctx, logoImg, canvas.width, canvas.height, frameCount);

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

      previewIntervalRef.current = setInterval(renderFrame, 33);
    };
    logoImg.src = URL.createObjectURL(file);
  };

  const stopPreview = () => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  };

  // Start/stop preview based on isActive and logoFile
  useEffect(() => {
    if (isActive && logoFile) {
      startPreview(logoFile);
    } else {
      stopPreview();
    }

    return () => stopPreview();
  }, [isActive, logoFile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPreview();
  }, []);

  return {
    displayCanvasRef,
    currentBgIndex,
    stopPreview
  };
}