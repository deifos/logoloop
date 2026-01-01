"use client";

import { useRef, useEffect, useState } from "react";
import { getBackgroundImages } from "@/lib/simpleVideoGenerator";

interface UsePreviewOptions {
  logoFile: File | null;
  logoSize: number;
  speed: number;
  enableWiggle: boolean;
  enableRealisticEffect: boolean;
  enableStickerBorder: boolean;
  aspectRatio: "16:9" | "9:16" | "1:1";
  customBackgrounds: File[];
  isActive: boolean;
}

// Get canvas dimensions based on aspect ratio
function getCanvasDimensions(aspectRatio: "16:9" | "9:16" | "1:1"): { width: number; height: number } {
  switch (aspectRatio) {
    case "9:16":
      return { width: 720, height: 1280 };
    case "1:1":
      return { width: 1080, height: 1080 };
    case "16:9":
    default:
      return { width: 1280, height: 720 };
  }
}

export function usePreview({ logoFile, logoSize, speed, enableWiggle, enableRealisticEffect, enableStickerBorder, aspectRatio, customBackgrounds, isActive }: UsePreviewOptions) {
  const [currentBgIndex, setCurrentBgIndex] = useState<number>(0);
  const [totalBackgrounds, setTotalBackgrounds] = useState<number>(37);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logoSizeRef = useRef<number>(logoSize);
  const speedRef = useRef<number>(speed);
  const enableWiggleRef = useRef<boolean>(enableWiggle);
  const enableRealisticEffectRef = useRef<boolean>(enableRealisticEffect);
  const enableStickerBorderRef = useRef<boolean>(enableStickerBorder);
  const aspectRatioRef = useRef<"16:9" | "9:16" | "1:1">(aspectRatio);
  const customBackgroundsRef = useRef<File[]>(customBackgrounds);
  const isActiveRef = useRef<boolean>(isActive);
  const frameCountRef = useRef<number>(0);
  const lastBgIndexRef = useRef<number>(-1);

  // Keep refs in sync with state for real-time preview
  useEffect(() => {
    logoSizeRef.current = logoSize;
  }, [logoSize]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    enableWiggleRef.current = enableWiggle;
  }, [enableWiggle]);

  useEffect(() => {
    enableRealisticEffectRef.current = enableRealisticEffect;
  }, [enableRealisticEffect]);

  useEffect(() => {
    enableStickerBorderRef.current = enableStickerBorder;
  }, [enableStickerBorder]);

  useEffect(() => {
    aspectRatioRef.current = aspectRatio;
  }, [aspectRatio]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    customBackgroundsRef.current = customBackgrounds;
  }, [customBackgrounds]);

  // Calculate frames per background based on speed (10-100)
  // Speed 10 = 27 frames (slow), Speed 50 = 16 frames, Speed 100 = 2 frames (fast)
  const getFramesPerBg = () => Math.max(2, Math.round(30 - speedRef.current * 0.28));

  const drawLogoOnCanvas = (
    ctx: CanvasRenderingContext2D,
    logoImg: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    frameCount: number
  ) => {
    const baseScale = logoSizeRef.current / 100;
    const framesPerBg = getFramesPerBg();

    let scaleVariation = 1;
    let rotationAngle = 0;
    let positionOffsetX = 0;
    let positionOffsetY = 0;
    let shadowOffsetX = 3;
    let shadowOffsetY = 3;

    // Wiggle effect - random position/rotation per background
    if (enableWiggleRef.current) {
      const bgIndex = Math.floor(frameCount / framesPerBg);
      const hash1 = ((bgIndex * 1237) % 100) / 100;
      const hash2 = ((bgIndex * 2749) % 100) / 100;
      const hash3 = ((bgIndex * 3571) % 100) / 100;
      const hash4 = ((bgIndex * 4919) % 100) / 100;

      scaleVariation = 1 + ((hash1 - 0.5) * 0.1); // ±5% size variation
      rotationAngle = (hash2 - 0.5) * 6; // ±3 degrees rotation
      positionOffsetX = (hash3 - 0.5) * 16; // ±8px horizontal offset
      positionOffsetY = (hash4 - 0.5) * 16; // ±8px vertical offset
    }

    // Realistic effect - shadow and scale changes synced with background
    if (enableRealisticEffectRef.current) {
      const bgIndex = Math.floor(frameCount / framesPerBg);

      // Use hash functions for deterministic but varied values per background
      const hash5 = ((bgIndex * 5381) % 100) / 100;
      const hash6 = ((bgIndex * 6871) % 100) / 100;
      const hash7 = ((bgIndex * 7919) % 100) / 100;

      // Shadow position varies per background (simulating different light angles)
      shadowOffsetX = 2 + hash5 * 6; // 2-8px
      shadowOffsetY = 2 + hash6 * 5; // 2-7px

      // Scale varies per background (simulating different photo distances)
      const breathingScale = 0.97 + hash7 * 0.06; // 97% to 103%
      scaleVariation *= breathingScale;
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
      const borderWidth = Math.max(4, logoWidth * 0.03);
      const borderRadius = 15;

      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = enableRealisticEffectRef.current ? 6 + ((Math.floor(frameCount / framesPerBg) * 3541) % 100) / 100 * 6 : borderWidth * 2;
      ctx.shadowOffsetX = shadowOffsetX * 0.5;
      ctx.shadowOffsetY = shadowOffsetY * 0.5;

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

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      // Shadow for logo without border
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = enableRealisticEffectRef.current ? 5 + ((Math.floor(frameCount / framesPerBg) * 3541) % 100) / 100 * 5 : 8;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
    }

    ctx.drawImage(logoImg, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
    ctx.restore();
  };

  const startPreview = async (file: File, customBgs: File[]) => {
    stopPreview();
    const { width, height } = getCanvasDimensions(aspectRatioRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    previewCanvasRef.current = canvas;

    const ctx = canvas.getContext('2d')!;

    // Determine which backgrounds to use
    const useCustomBackgrounds = customBgs.length > 0;
    let preloadedBackgrounds: HTMLImageElement[];

    if (useCustomBackgrounds) {
      // Preload custom backgrounds from Files
      preloadedBackgrounds = await Promise.all(
        customBgs.map(async (bgFile) => {
          const img = new Image();
          img.src = URL.createObjectURL(bgFile);
          try {
            await img.decode();
          } catch (e) {
            // Fallback if decode fails
          }
          return img;
        })
      );
    } else {
      // Preload default background images
      const backgroundImagePaths = getBackgroundImages();
      preloadedBackgrounds = await Promise.all(
        backgroundImagePaths.map(async (src) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = src;
          try {
            await img.decode();
          } catch (e) {
            // Fallback if decode fails
          }
          return img;
        })
      );
    }

    // Update total backgrounds count
    setTotalBackgrounds(preloadedBackgrounds.length);

    const logoImg = new Image();
    logoImg.onload = () => {
      let lastFrameTime = 0;
      const frameInterval = 33; // ~30fps

      const renderFrame = (timestamp: number) => {
        // Throttle to ~30fps for consistent timing
        if (timestamp - lastFrameTime < frameInterval) {
          previewIntervalRef.current = requestAnimationFrame(renderFrame) as unknown as NodeJS.Timeout;
          return;
        }
        lastFrameTime = timestamp;

        const framesPerBg = getFramesPerBg();
        const bgIndex = Math.floor(frameCountRef.current / framesPerBg) % preloadedBackgrounds.length;

        // Only update React state when background actually changes
        if (bgIndex !== lastBgIndexRef.current) {
          lastBgIndexRef.current = bgIndex;
          setCurrentBgIndex(bgIndex);
        }

        // Use preloaded background - no async loading, instant switch
        const bgImg = preloadedBackgrounds[bgIndex];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background with "cover" style (crop to fill, maintain aspect ratio)
        const imgAspect = bgImg.width / bgImg.height;
        const canvasAspect = canvas.width / canvas.height;

        let srcX = 0, srcY = 0, srcW = bgImg.width, srcH = bgImg.height;

        if (imgAspect > canvasAspect) {
          // Image is wider - crop sides
          srcW = bgImg.height * canvasAspect;
          srcX = (bgImg.width - srcW) / 2;
        } else {
          // Image is taller - crop top/bottom
          srcH = bgImg.width / canvasAspect;
          srcY = (bgImg.height - srcH) / 2;
        }

        ctx.drawImage(bgImg, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

        drawLogoOnCanvas(ctx, logoImg, canvas.width, canvas.height, frameCountRef.current);

        if (displayCanvasRef.current) {
          const displayCtx = displayCanvasRef.current.getContext('2d');
          if (displayCtx) {
            displayCanvasRef.current.width = canvas.width;
            displayCanvasRef.current.height = canvas.height;
            displayCtx.drawImage(canvas, 0, 0);
          }
        }

        // Only advance frame count when animation is active (not in resize mode)
        if (isActiveRef.current) {
          frameCountRef.current++;
        }

        previewIntervalRef.current = requestAnimationFrame(renderFrame) as unknown as NodeJS.Timeout;
      };

      previewIntervalRef.current = requestAnimationFrame(renderFrame) as unknown as NodeJS.Timeout;
    };
    logoImg.src = URL.createObjectURL(file);
  };

  const stopPreview = () => {
    if (previewIntervalRef.current) {
      cancelAnimationFrame(previewIntervalRef.current as unknown as number);
      previewIntervalRef.current = null;
    }
  };

  // Start preview when logoFile is available (keep running even when paused)
  // Restart when aspectRatio or customBackgrounds change
  useEffect(() => {
    if (logoFile) {
      startPreview(logoFile, customBackgrounds);
    } else {
      stopPreview();
    }

    return () => stopPreview();
  }, [logoFile, aspectRatio, customBackgrounds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPreview();
  }, []);

  return {
    displayCanvasRef,
    currentBgIndex,
    totalBackgrounds,
    stopPreview
  };
}