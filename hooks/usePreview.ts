"use client";

import { useRef, useEffect, useState } from "react";
import { getBackgroundImages } from "@/lib/simpleVideoGenerator";

interface UsePreviewOptions {
  logoFile: File | null;
  logoSize: number;
  enableVariations: boolean;
  enableStickerBorder: boolean;
  isActive: boolean;
}

export function usePreview({ logoFile, logoSize, enableVariations, enableStickerBorder, isActive }: UsePreviewOptions) {
  const [currentBgIndex, setCurrentBgIndex] = useState<number>(0);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logoSizeRef = useRef<number>(logoSize);
  const enableVariationsRef = useRef<boolean>(enableVariations);
  const enableStickerBorderRef = useRef<boolean>(enableStickerBorder);

  // Keep refs in sync with state for real-time preview
  useEffect(() => {
    logoSizeRef.current = logoSize;
  }, [logoSize]);

  useEffect(() => {
    enableVariationsRef.current = enableVariations;
  }, [enableVariations]);

  useEffect(() => {
    enableStickerBorderRef.current = enableStickerBorder;
  }, [enableStickerBorder]);

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
      scaleVariation = 1 + (Math.sin(variationSeed * 2.1) * 0.05); // ±5% size variation
      rotationAngle = Math.sin(variationSeed * 1.7) * 2; // ±2 degrees rotation
      positionOffsetX = Math.sin(variationSeed * 1.3) * 8; // Scaled up for higher resolution (4px -> 8px)
      positionOffsetY = Math.cos(variationSeed * 1.9) * 8; // Scaled up for higher resolution (4px -> 8px)
    }

    const logoScale = baseScale * scaleVariation;
    const logoWidth = logoImg.width * logoScale;
    const logoHeight = logoImg.height * logoScale;
    const logoX = (canvasWidth - logoWidth) / 2 + positionOffsetX;
    const logoY = (canvasHeight - logoHeight) / 2 + positionOffsetY;

    ctx.save();
    ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
    ctx.rotate(rotationAngle * Math.PI / 180);

    // Add sticker border if enabled
    if (enableStickerBorderRef.current) {
      const borderWidth = Math.max(2, logoWidth * 0.02); // 2% of logo width, minimum 2px
      const borderRadius = borderWidth * 2;

      // Draw white border background
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = borderWidth * 2;
      ctx.shadowOffsetX = borderWidth * 0.5;
      ctx.shadowOffsetY = borderWidth * 0.5;

      // Rounded rectangle for sticker effect
      const x = -logoWidth / 2 - borderWidth;
      const y = -logoHeight / 2 - borderWidth;
      const w = logoWidth + (borderWidth * 2);
      const h = logoHeight + (borderWidth * 2);

      ctx.beginPath();
      ctx.moveTo(x + borderRadius, y);
      ctx.lineTo(x + w - borderRadius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
      ctx.lineTo(x + w, y + h - borderRadius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
      ctx.lineTo(x + borderRadius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
      ctx.lineTo(x, y + borderRadius);
      ctx.quadraticCurveTo(x, y, x + borderRadius, y);
      ctx.closePath();
      ctx.fill();

      // Reset shadow for logo
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      // Original shadow for logo without border
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
    }

    ctx.drawImage(logoImg, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
    ctx.restore();
  };

  const startPreview = (file: File) => {
    stopPreview();
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
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