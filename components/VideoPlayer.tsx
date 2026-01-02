"use client";

import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Spinner } from "@heroui/spinner";

interface VideoPlayerProps {
  isProcessing: boolean;
  progress: number;
  videoReady: boolean;
  videoPreviewUrl: string | null;
  onDownload: () => void;
  onResetToPreview: () => void;
  onRegenerate: () => void;
}

export default function VideoPlayer({
  isProcessing,
  progress,
  videoReady,
  videoPreviewUrl,
  onDownload,
  onResetToPreview,
  onRegenerate,
}: VideoPlayerProps) {
  return (
    <>
      {/* Video Generation/Result View */}
      {isProcessing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-default-600 mb-2">Generating your video...</p>
          <Progress value={progress} className="w-3/4" color="primary" />
          <p className="text-sm text-default-500 mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>
      ) : videoReady && videoPreviewUrl ? (
        <video
          controls
          className="w-full h-full object-contain"
          src={videoPreviewUrl}
          preload="metadata"
        >
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      ) : null}

      {/* Action Buttons */}
      {videoReady && !isProcessing && (
        <div className="mt-4 space-y-3">
          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={onDownload}
          >
            Download Video (.mp4)
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="bordered" size="md" onPress={onResetToPreview}>
              Back to Preview
            </Button>
            <Button variant="bordered" size="md" onPress={onRegenerate}>
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
