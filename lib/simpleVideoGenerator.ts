import {
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource,
  QUALITY_HIGH,
} from "mediabunny";

export interface SimpleVideoOptions {
  logoFile: File;
  backgroundImages: string[];
  duration?: number;
  width?: number;
  height?: number;
  logoSize?: number; // Logo size as percentage (1-50)
  enableWiggle?: boolean; // Whether to enable wiggle effect
  enableRealisticEffect?: boolean; // Whether to enable realistic shadow/scale effect
  enableStickerBorder?: boolean; // Whether to add sticker border effect
  speed?: number; // Speed of background changes (10-100)
  onProgress?: (progress: number) => void;
}

export class SimpleVideoGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
  }

  async generateVideo(options: SimpleVideoOptions): Promise<ArrayBuffer> {
    const {
      logoFile,
      backgroundImages,
      duration = 5,
      width = 640,
      height = 480,
      logoSize = 15, // Default 15% size
      enableWiggle = true,
      enableRealisticEffect = false,
      enableStickerBorder = false,
      speed = 50, // Default 50% speed
      onProgress,
    } = options;

    // Calculate frames per background based on speed (10-100)
    // Speed 10 = 27 frames (slow), Speed 50 = 16 frames, Speed 100 = 2 frames (fast)
    const framesPerBg = Math.max(2, Math.round(30 - speed * 0.28));

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Create output with MP4 format for H.264
    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat(),
      target,
    });

    // Load logo
    const logoImage = await this.loadImage(logoFile);

    // Create video source with AVC/H.264 (MP4)
    const videoSource = new CanvasSource(this.canvas, {
      codec: "avc",
      bitrate: QUALITY_HIGH,
    });

    // Add video track
    output.addVideoTrack(videoSource, { frameRate: 20 });

    await output.start();

    // Generate frames
    const fps = 20;
    const totalFrames = duration * fps;
    const frameInterval = 1 / fps;

    for (let frame = 0; frame < totalFrames; frame++) {
      const timestamp = frame * frameInterval;

      // Choose background image based on speed setting
      const bgIndex = Math.floor(frame / framesPerBg) % backgroundImages.length;
      const backgroundPath = backgroundImages[bgIndex];

      // Draw frame
      await this.drawFrame(
        backgroundPath,
        logoImage,
        logoSize,
        enableWiggle,
        enableRealisticEffect,
        enableStickerBorder,
        frame,
        framesPerBg,
      );

      // Add frame to video
      await videoSource.add(timestamp, frameInterval);

      // Report progress
      if (onProgress) {
        const progress = ((frame + 1) / totalFrames) * 100;
        onProgress(progress);
      }
    }

    videoSource.close();
    await output.finalize();

    return target.buffer!;
  }

  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async drawFrame(
    backgroundPath: string,
    logoImage: HTMLImageElement,
    logoSizePercent: number,
    enableWiggle: boolean,
    enableRealisticEffect: boolean,
    enableStickerBorder: boolean,
    frameIndex: number,
    framesPerBg: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const bgImg = new Image();

      bgImg.onload = () => {
        try {
          // Clear canvas
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

          // Draw background with "cover" style (crop to fill, maintain aspect ratio)
          const imgAspect = bgImg.width / bgImg.height;
          const canvasAspect = this.canvas.width / this.canvas.height;

          let srcX = 0,
            srcY = 0,
            srcW = bgImg.width,
            srcH = bgImg.height;

          if (imgAspect > canvasAspect) {
            srcW = bgImg.height * canvasAspect;
            srcX = (bgImg.width - srcW) / 2;
          } else {
            srcH = bgImg.width / canvasAspect;
            srcY = (bgImg.height - srcH) / 2;
          }

          this.ctx.drawImage(
            bgImg,
            srcX,
            srcY,
            srcW,
            srcH,
            0,
            0,
            this.canvas.width,
            this.canvas.height,
          );

          // Draw logo with effects
          const baseScale = logoSizePercent / 100;

          let scaleVariation = 1;
          let rotationAngle = 0;
          let positionOffsetX = 0;
          let positionOffsetY = 0;
          let shadowOffsetX = 3;
          let shadowOffsetY = 3;

          // Wiggle effect - random position/rotation per background
          if (enableWiggle) {
            const bgIndex = Math.floor(frameIndex / framesPerBg);
            const hash1 = ((bgIndex * 1237) % 100) / 100;
            const hash2 = ((bgIndex * 2749) % 100) / 100;
            const hash3 = ((bgIndex * 3571) % 100) / 100;
            const hash4 = ((bgIndex * 4919) % 100) / 100;

            scaleVariation = 1 + (hash1 - 0.5) * 0.1;
            rotationAngle = (hash2 - 0.5) * 6;
            positionOffsetX = (hash3 - 0.5) * 16;
            positionOffsetY = (hash4 - 0.5) * 16;
          }

          // Realistic effect - shadow and scale changes synced with background
          if (enableRealisticEffect) {
            const bgIndex = Math.floor(frameIndex / framesPerBg);

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
          const logoWidth = logoImage.width * logoScale;
          const logoHeight = logoImage.height * logoScale;
          const logoX = (this.canvas.width - logoWidth) / 2 + positionOffsetX;
          const logoY = (this.canvas.height - logoHeight) / 2 + positionOffsetY;

          this.ctx.save();
          this.ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
          this.ctx.rotate((rotationAngle * Math.PI) / 180);

          if (enableStickerBorder) {
            const borderWidth = Math.max(4, logoWidth * 0.03);
            const borderRadius = 15;

            this.ctx.fillStyle = "white";
            this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            this.ctx.shadowBlur = enableRealisticEffect
              ? 6 +
                (((Math.floor(frameIndex / framesPerBg) * 3541) % 100) / 100) *
                  6
              : borderWidth * 2;
            this.ctx.shadowOffsetX = shadowOffsetX * 0.5;
            this.ctx.shadowOffsetY = shadowOffsetY * 0.5;

            const x = -logoWidth / 2 - borderWidth;
            const y = -logoHeight / 2 - borderWidth;
            const w = logoWidth + borderWidth * 2;
            const h = logoHeight + borderWidth * 2;

            this.ctx.beginPath();
            this.ctx.moveTo(x + borderRadius, y);
            this.ctx.lineTo(x + w - borderRadius, y);
            this.ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
            this.ctx.lineTo(x + w, y + h - borderRadius);
            this.ctx.quadraticCurveTo(
              x + w,
              y + h,
              x + w - borderRadius,
              y + h,
            );
            this.ctx.lineTo(x + borderRadius, y + h);
            this.ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
            this.ctx.lineTo(x, y + borderRadius);
            this.ctx.quadraticCurveTo(x, y, x + borderRadius, y);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.shadowColor = "transparent";
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
          } else {
            this.ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
            this.ctx.shadowBlur = enableRealisticEffect
              ? 5 +
                (((Math.floor(frameIndex / framesPerBg) * 3541) % 100) / 100) *
                  5
              : 8;
            this.ctx.shadowOffsetX = shadowOffsetX;
            this.ctx.shadowOffsetY = shadowOffsetY;
          }

          this.ctx.drawImage(
            logoImage,
            -logoWidth / 2,
            -logoHeight / 2,
            logoWidth,
            logoHeight,
          );
          this.ctx.restore();

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      bgImg.onerror = reject;
      bgImg.crossOrigin = "anonymous";
      bgImg.src = backgroundPath;
    });
  }
}

// Utility functions
export function getBackgroundImages(): string[] {
  const images: string[] = [];
  for (let i = 1; i <= 37; i++) {
    images.push(`/logoloops/image${i}.jpg`);
  }
  return images;
}

export function downloadVideo(
  buffer: ArrayBuffer,
  filename: string = "logoloop.mp4",
): void {
  const blob = new Blob([buffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
