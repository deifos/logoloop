import {
  Output,
  Mp4OutputFormat,
  BufferTarget,
  CanvasSource,
  VideoEncodingConfig,
  AudioSampleSource,
  AudioEncodingConfig,
  AudioSample,
  QUALITY_HIGH,
  canEncodeVideo,
  WebMOutputFormat
} from 'mediabunny';

export interface VideoGenerationOptions {
  logoFile: File;
  backgroundImages: string[];
  duration?: number; // Total video duration in seconds
  frameDuration?: number; // Duration each background is shown in seconds
  logoScale?: number; // Scale factor for the logo (0.1 to 1.0)
  logoPosition?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  videoWidth?: number;
  videoHeight?: number;
  onProgress?: (progress: number) => void;
}

export class VideoGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logoImage: HTMLImageElement | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async checkCodecSupport(): Promise<{ codec: string; format: any; mimeType: string } | null> {
    try {
      // Check VP8 (WebM) support first
      const canEncodeVP8 = await canEncodeVideo('vp8', {
        width: 1280,
        height: 720,
        bitrate: QUALITY_HIGH
      });
      console.log('VP8 encoding support:', canEncodeVP8);

      if (canEncodeVP8) {
        return {
          codec: 'vp8',
          format: new WebMOutputFormat(),
          mimeType: 'video/webm'
        };
      }

      // Fallback to H.264
      const canEncodeH264 = await canEncodeVideo('h264', {
        width: 1280,
        height: 720,
        bitrate: QUALITY_HIGH
      });
      console.log('H.264 encoding support:', canEncodeH264);

      if (canEncodeH264) {
        return {
          codec: 'h264',
          format: new Mp4OutputFormat(),
          mimeType: 'video/mp4'
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking codec support:', error);
      return null;
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<ArrayBuffer> {
    console.log('Starting video generation with options:', options);

    const {
      logoFile,
      backgroundImages,
      duration = 10, // 10 seconds default
      frameDuration = 0.2, // Change background every 200ms
      logoScale = 0.3,
      logoPosition = 'center',
      videoWidth = 1920,
      videoHeight = 1080,
      onProgress
    } = options;

    try {
      // Check codec support first
      const codecInfo = await this.checkCodecSupport();
      if (!codecInfo) {
        throw new Error('No supported video encoding codec found in this browser');
      }

      console.log('Using codec:', codecInfo.codec, 'with format:', codecInfo.format.constructor.name);

      // Set canvas dimensions
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
      console.log(`Canvas dimensions set to ${videoWidth}x${videoHeight}`);

      // Load the logo image
      console.log('Loading logo image...');
      await this.loadLogo(logoFile);
      console.log('Logo loaded successfully');

      // Create output configuration
      const target = new BufferTarget();
      const output = new Output({
        format: codecInfo.format,
        target
      });

      // Video encoding config
      const videoConfig: VideoEncodingConfig = {
        codec: codecInfo.codec as any,
        bitrate: QUALITY_HIGH,
      };

      // Create video source
      const videoSource = new CanvasSource(this.canvas, videoConfig);
      output.addVideoTrack(videoSource);

      console.log('Starting output...');
      // Start the output
      await output.start();
      console.log('Output started successfully');

      // Generate frames
      const fps = 30;
      const frameInterval = 1 / fps;
      const totalFrames = Math.floor(duration * fps);
      const framesPerBackground = Math.floor(frameDuration * fps);

      console.log(`Generating ${totalFrames} frames at ${fps} FPS`);

      for (let frame = 0; frame < totalFrames; frame++) {
        const timestamp = frame * frameInterval;

        // Determine which background image to use
        const backgroundIndex = Math.floor(frame / framesPerBackground) % backgroundImages.length;
        const backgroundImagePath = backgroundImages[backgroundIndex];

        // Load and draw the background
        await this.drawBackground(backgroundImagePath);

        // Draw the logo overlay
        this.drawLogo(logoScale, logoPosition);

        // Add frame to video
        await videoSource.add(timestamp, frameInterval);

        // Report progress
        if (onProgress) {
          const progress = (frame + 1) / totalFrames * 100;
          onProgress(progress);
        }

        // Log progress occasionally
        if (frame % 30 === 0) {
          console.log(`Generated frame ${frame + 1}/${totalFrames}`);
        }
      }

      console.log('Finalizing video...');
      // Close the video source and finalize
      videoSource.close();
      await output.finalize();

      console.log('Video generation completed successfully');
      return target.buffer!;
    } catch (error) {
      console.error('Error during video generation:', error);
      throw error;
    }
  }

  private async loadLogo(logoFile: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.logoImage = img;
        resolve();
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(logoFile);
    });
  }

  private async drawBackground(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Clear canvas
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

          // Draw background image, scaled to fill canvas
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
          resolve();
        } catch (error) {
          console.error('Error drawing background:', error);
          reject(error);
        }
      };
      img.onerror = (error) => {
        console.error('Failed to load background image:', imagePath, error);
        reject(error);
      };
      img.crossOrigin = 'anonymous'; // Add CORS support
      img.src = imagePath;
    });
  }

  private drawLogo(scale: number, position: string): void {
    if (!this.logoImage) return;

    const logoWidth = this.logoImage.width * scale;
    const logoHeight = this.logoImage.height * scale;

    let x: number, y: number;

    switch (position) {
      case 'center':
        x = (this.canvas.width - logoWidth) / 2;
        y = (this.canvas.height - logoHeight) / 2;
        break;
      case 'top-left':
        x = 50;
        y = 50;
        break;
      case 'top-right':
        x = this.canvas.width - logoWidth - 50;
        y = 50;
        break;
      case 'bottom-left':
        x = 50;
        y = this.canvas.height - logoHeight - 50;
        break;
      case 'bottom-right':
        x = this.canvas.width - logoWidth - 50;
        y = this.canvas.height - logoHeight - 50;
        break;
      default:
        x = (this.canvas.width - logoWidth) / 2;
        y = (this.canvas.height - logoHeight) / 2;
    }

    // Add a subtle drop shadow for better visibility
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    this.ctx.drawImage(this.logoImage, x, y, logoWidth, logoHeight);

    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }
}

// Utility function to get list of background images
export function getBackgroundImages(): string[] {
  const imageCount = 37; // We know there are 37 images from the ls command
  const images: string[] = [];

  for (let i = 1; i <= imageCount; i++) {
    images.push(`/logoloops/image${i}.jpg`);
  }

  return images;
}

// Utility function to create and trigger download
export function downloadVideo(buffer: ArrayBuffer, filename: string = 'logoloop-video.mp4', mimeType: string = 'video/mp4'): void {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}