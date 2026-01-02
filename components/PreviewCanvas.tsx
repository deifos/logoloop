"use client";

import { usePreview } from "@/hooks/usePreview";
import { useRef, useState, useCallback, useEffect } from "react";

interface PreviewCanvasProps {
  logoFile: File | null;
  logoSize: number;
  speed: number;
  enableWiggle: boolean;
  enableRealisticEffect: boolean;
  enableStickerBorder: boolean;
  resizeMode: boolean;
  aspectRatio: "16:9" | "9:16" | "1:1";
  customBackgrounds: File[];
  onLogoSizeChange: (size: number) => void;
}

export default function PreviewCanvas({
  logoFile,
  logoSize,
  speed,
  enableWiggle,
  enableRealisticEffect,
  enableStickerBorder,
  resizeMode,
  aspectRatio,
  customBackgrounds,
  onLogoSizeChange,
}: PreviewCanvasProps) {
  // When in resize mode, pause animation (pass isActive: !resizeMode)
  const { displayCanvasRef, currentBgIndex, totalBackgrounds } = usePreview({
    logoFile,
    logoSize,
    speed,
    enableWiggle,
    enableRealisticEffect,
    enableStickerBorder,
    aspectRatio,
    customBackgrounds,
    isActive: !resizeMode, // Pause when resizing
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoDimensions, setLogoDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; size: number } | null>(
    null,
  );

  // Load logo dimensions when file changes
  useEffect(() => {
    if (!logoFile) {
      setLogoDimensions(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setLogoDimensions({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(logoFile);

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [logoFile]);

  // Get the logo bounds in screen coordinates
  const getLogoBounds = useCallback(() => {
    if (!containerRef.current || !displayCanvasRef.current || !logoDimensions)
      return null;

    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    // Use actual logo dimensions
    const logoScale = logoSize / 100;
    const logoWidth = logoDimensions.width * logoScale;
    const logoHeight = logoDimensions.height * logoScale;

    const logoX = (canvas.width - logoWidth) / 2;
    const logoY = (canvas.height - logoHeight) / 2;

    return {
      left: rect.left + logoX * scaleX,
      top: rect.top + logoY * scaleY,
      width: logoWidth * scaleX,
      height: logoHeight * scaleY,
      centerX: rect.left + (canvas.width / 2) * scaleX,
      centerY: rect.top + (canvas.height / 2) * scaleY,
    };
  }, [logoSize, displayCanvasRef, logoDimensions]);

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!resizeMode) return;

      const bounds = getLogoBounds();
      if (!bounds) return;

      // Check if clicking near any corner
      const corners = [
        { x: bounds.left, y: bounds.top },
        { x: bounds.left + bounds.width, y: bounds.top },
        { x: bounds.left, y: bounds.top + bounds.height },
        { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
      ];

      const hitRadius = 30;
      const isNearCorner = corners.some((corner) => {
        const dx = e.clientX - corner.x;
        const dy = e.clientY - corner.y;
        return Math.sqrt(dx * dx + dy * dy) < hitRadius;
      });

      if (isNearCorner) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          size: logoSize,
        };
        e.preventDefault();
      }
    },
    [resizeMode, getLogoBounds, logoSize],
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!resizeMode || !isDragging || !dragStartRef.current) return;

      const bounds = getLogoBounds();
      if (!bounds) return;

      // Calculate distance from center
      const startDist = Math.sqrt(
        Math.pow(dragStartRef.current.x - bounds.centerX, 2) +
          Math.pow(dragStartRef.current.y - bounds.centerY, 2),
      );
      const currentDist = Math.sqrt(
        Math.pow(e.clientX - bounds.centerX, 2) +
          Math.pow(e.clientY - bounds.centerY, 2),
      );

      const scale = currentDist / startDist;
      const newSize = Math.min(
        500,
        Math.max(2, Math.round(dragStartRef.current.size * scale)),
      );

      onLogoSizeChange(newSize);
    },
    [resizeMode, isDragging, getLogoBounds, onLogoSizeChange],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Global mouse up listener
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
      };
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current) return;

        const bounds = getLogoBounds();
        if (!bounds) return;

        const startDist = Math.sqrt(
          Math.pow(dragStartRef.current.x - bounds.centerX, 2) +
            Math.pow(dragStartRef.current.y - bounds.centerY, 2),
        );
        const currentDist = Math.sqrt(
          Math.pow(e.clientX - bounds.centerX, 2) +
            Math.pow(e.clientY - bounds.centerY, 2),
        );

        const scale = currentDist / startDist;
        const newSize = Math.min(
          500,
          Math.max(2, Math.round(dragStartRef.current.size * scale)),
        );

        onLogoSizeChange(newSize);
      };

      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("mousemove", handleGlobalMouseMove);
      return () => {
        window.removeEventListener("mouseup", handleGlobalMouseUp);
        window.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }
  }, [isDragging, getLogoBounds, onLogoSizeChange]);

  if (!logoFile) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-default-500">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-default-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p>Upload a logo to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        cursor: resizeMode
          ? isDragging
            ? "nwse-resize"
            : "default"
          : "default",
      }}
    >
      <canvas ref={displayCanvasRef} className="w-full h-full object-contain" />

      {/* Corner resize handles - only show in resize mode */}
      {resizeMode && logoDimensions && (
        <CornerHandles
          logoSize={logoSize}
          logoDimensions={logoDimensions}
          containerRef={containerRef}
          canvasRef={displayCanvasRef}
        />
      )}

      {/* Status badges */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          Background {currentBgIndex + 1}/{totalBackgrounds}
        </div>
        {resizeMode && (
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-medium">
            Resize Mode: {logoSize}%
          </div>
        )}
      </div>

      {/* Resize mode instruction */}
      {resizeMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          Drag any corner to resize the logo
        </div>
      )}
    </div>
  );
}

// Corner handles component
function CornerHandles({
  logoSize,
  logoDimensions,
  containerRef,
  canvasRef,
}: {
  logoSize: number;
  logoDimensions: { width: number; height: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current || !canvasRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      const containerRect = container.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      const scaleX = canvasRect.width / canvas.width;
      const scaleY = canvasRect.height / canvas.height;

      // Use actual logo dimensions
      const logoScale = logoSize / 100;
      const logoWidth = logoDimensions.width * logoScale;
      const logoHeight = logoDimensions.height * logoScale;

      const logoX = (canvas.width - logoWidth) / 2;
      const logoY = (canvas.height - logoHeight) / 2;

      const offsetX = canvasRect.left - containerRect.left;
      const offsetY = canvasRect.top - containerRect.top;

      const corners = [
        { x: offsetX + logoX * scaleX, y: offsetY + logoY * scaleY },
        {
          x: offsetX + (logoX + logoWidth) * scaleX,
          y: offsetY + logoY * scaleY,
        },
        {
          x: offsetX + logoX * scaleX,
          y: offsetY + (logoY + logoHeight) * scaleY,
        },
        {
          x: offsetX + (logoX + logoWidth) * scaleX,
          y: offsetY + (logoY + logoHeight) * scaleY,
        },
      ];

      setPositions(corners);
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    const interval = setInterval(updatePositions, 50);

    return () => {
      window.removeEventListener("resize", updatePositions);
      clearInterval(interval);
    };
  }, [logoSize, logoDimensions, containerRef, canvasRef]);

  if (positions.length === 0) return null;

  return (
    <>
      {/* Dashed border around logo */}
      {positions.length === 4 && (
        <div
          className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
          style={{
            left: positions[0].x,
            top: positions[0].y,
            width: positions[1].x - positions[0].x,
            height: positions[2].y - positions[0].y,
          }}
        />
      )}

      {/* Corner handles */}
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize shadow-lg"
          style={{
            left: pos.x - 10,
            top: pos.y - 10,
          }}
        />
      ))}
    </>
  );
}
