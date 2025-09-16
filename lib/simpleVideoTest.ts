// Simple test to verify MediaBunny works in the browser
export async function testMediaBunnyBasics(): Promise<string> {
  try {
    // Try to import MediaBunny
    const { canEncodeVideo, QUALITY_HIGH } = await import('mediabunny');

    console.log('MediaBunny imported successfully');

    // Test codec support
    const h264Support = await canEncodeVideo('h264', {
      width: 640,
      height: 480,
      bitrate: QUALITY_HIGH
    });

    const vp8Support = await canEncodeVideo('vp8', {
      width: 640,
      height: 480,
      bitrate: QUALITY_HIGH
    });

    const vp9Support = await canEncodeVideo('vp9', {
      width: 640,
      height: 480,
      bitrate: QUALITY_HIGH
    });

    const results = {
      h264: h264Support,
      vp8: vp8Support,
      vp9: vp9Support
    };

    console.log('Codec support results:', results);

    return `MediaBunny test successful. Codec support: H.264: ${h264Support}, VP8: ${vp8Support}, VP9: ${vp9Support}`;

  } catch (error) {
    console.error('MediaBunny test failed:', error);
    return `MediaBunny test failed: ${error}`;
  }
}

// Test canvas creation and basic operations
export function testCanvasOperations(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    canvas.width = 640;
    canvas.height = 480;

    // Draw a simple rectangle
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);

    // Test image data
    const imageData = ctx.getImageData(0, 0, 100, 100);

    console.log('Canvas test successful, image data length:', imageData.data.length);

    return 'Canvas operations test successful';

  } catch (error) {
    console.error('Canvas test failed:', error);
    return `Canvas test failed: ${error}`;
  }
}