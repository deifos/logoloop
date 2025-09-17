import {
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource,
  QUALITY_HIGH
} from 'mediabunny';

export interface SimpleVideoOptions {
  logoFile: File;
  backgroundImages: string[];
  duration?: number;
  width?: number;
  height?: number;
  logoSize?: number; // Logo size as percentage (1-50)
  enableVariations?: boolean; // Whether to enable random variations
  enableStickerBorder?: boolean; // Whether to add sticker border effect
  onProgress?: (progress: number) => void;
}

export class SimpleVideoGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateVideo(options: SimpleVideoOptions): Promise<ArrayBuffer> {
    const {
      logoFile,
      backgroundImages,
      duration = 5,
      width = 640,
      height = 480,
      logoSize = 15, // Default 15% size
      enableVariations = true,
      enableStickerBorder = false,
      onProgress
    } = options;

    console.log('🎬 Starting simple video generation...');

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    console.log(`📐 Canvas size: ${width}x${height}`);

    // Create output with MP4 format for H.264
    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat(),
      target
    });

    // Load logo
    console.log('🖼️ Loading logo...');
    const logoImage = await this.loadImage(logoFile);
    console.log('✅ Logo loaded');

    // Create video source with AVC/H.264 (MP4)
    const videoSource = new CanvasSource(this.canvas, {
      codec: 'avc',
      bitrate: QUALITY_HIGH
    });

    // Add video track
    output.addVideoTrack(videoSource, { frameRate: 20 }); // Higher frame rate for smoother video

    console.log('🚀 Starting output...');
    await output.start();
    console.log('✅ Output started');

    // Generate frames
    const fps = 20; // Higher FPS for smoother video
    const totalFrames = duration * fps;
    const frameInterval = 1 / fps;

    console.log(`🎞️ Generating ${totalFrames} frames at ${fps} FPS`);

    for (let frame = 0; frame < totalFrames; frame++) {
      const timestamp = frame * frameInterval;

      // Choose background image - change every 3 frames (faster transitions)
      const bgIndex = Math.floor(frame / 3) % backgroundImages.length;
      const backgroundPath = backgroundImages[bgIndex];

      console.log(`Frame ${frame + 1}/${totalFrames} - Background: ${backgroundPath}`);

      // Draw frame
      await this.drawFrame(backgroundPath, logoImage, logoSize, enableVariations, enableStickerBorder, frame);

      // Add frame to video
      await videoSource.add(timestamp, frameInterval);

      // Report progress
      if (onProgress) {
        const progress = ((frame + 1) / totalFrames) * 100;
        onProgress(progress);
      }
    }

    console.log('🔄 Finalizing video...');
    videoSource.close();
    await output.finalize();

    console.log('✅ Video generation complete!');
    console.log(`📁 Buffer size: ${target.buffer!.byteLength} bytes`);

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

  private async drawFrame(backgroundPath: string, logoImage: HTMLImageElement, logoSizePercent: number, enableVariations: boolean, enableStickerBorder: boolean, frameIndex: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const bgImg = new Image();

      bgImg.onload = () => {
        try {
          // Clear canvas
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

          // Draw background (scaled to fill)
          this.ctx.drawImage(bgImg, 0, 0, this.canvas.width, this.canvas.height);

          // Draw logo with optional variations
          const baseScale = logoSizePercent / 100;

          let scaleVariation = 1;
          let rotationAngle = 0;
          let positionOffsetX = 0;
          let positionOffsetY = 0;

          if (enableVariations) {
            // Sync variations with background changes (every 3 frames)
            const variationSeed = Math.floor(frameIndex / 3);

            // Use consistent pseudo-random variations based on background
            scaleVariation = 1 + (Math.sin(variationSeed * 2.1) * 0.05); // ±5% size variation
            rotationAngle = Math.sin(variationSeed * 1.7) * 2; // ±2 degrees rotation
            positionOffsetX = Math.sin(variationSeed * 1.3) * 8; // ±8px horizontal offset (scaled for higher res)
            positionOffsetY = Math.cos(variationSeed * 1.9) * 8; // ±8px vertical offset (scaled for higher res)
          }

          const logoScale = baseScale * scaleVariation;
          const logoWidth = logoImage.width * logoScale;
          const logoHeight = logoImage.height * logoScale;
          const logoX = (this.canvas.width - logoWidth) / 2 + positionOffsetX;
          const logoY = (this.canvas.height - logoHeight) / 2 + positionOffsetY;

          // Save context for rotation
          this.ctx.save();

          // Move to logo center for rotation
          this.ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
          this.ctx.rotate(rotationAngle * Math.PI / 180);

          // Add sticker border if enabled
          if (enableStickerBorder) {
            const borderWidth = Math.max(2, logoWidth * 0.02); // 2% of logo width, minimum 2px
            const borderRadius = borderWidth * 2;

            // Draw white border background
            this.ctx.fillStyle = 'white';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = borderWidth * 2;
            this.ctx.shadowOffsetX = borderWidth * 0.5;
            this.ctx.shadowOffsetY = borderWidth * 0.5;

            // Rounded rectangle for sticker effect
            const x = -logoWidth / 2 - borderWidth;
            const y = -logoHeight / 2 - borderWidth;
            const w = logoWidth + (borderWidth * 2);
            const h = logoHeight + (borderWidth * 2);

            this.ctx.beginPath();
            this.ctx.moveTo(x + borderRadius, y);
            this.ctx.lineTo(x + w - borderRadius, y);
            this.ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
            this.ctx.lineTo(x + w, y + h - borderRadius);
            this.ctx.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
            this.ctx.lineTo(x + borderRadius, y + h);
            this.ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
            this.ctx.lineTo(x, y + borderRadius);
            this.ctx.quadraticCurveTo(x, y, x + borderRadius, y);
            this.ctx.closePath();
            this.ctx.fill();

            // Reset shadow for logo
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
          } else {
            // Original shadow for logo without border
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 3;
            this.ctx.shadowOffsetY = 3;
          }

          // Draw logo (centered on rotation point)
          this.ctx.drawImage(logoImage, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);

          // Restore context
          this.ctx.restore();

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      bgImg.onerror = reject;
      bgImg.crossOrigin = 'anonymous';
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

export function downloadVideo(buffer: ArrayBuffer, filename: string = 'logoloop.mp4'): void {
  const blob = new Blob([buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}