"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";

interface BackgroundUploadProps {
  backgrounds: File[];
  onBackgroundsChange: (files: File[]) => void;
}

export default function BackgroundUpload({
  backgrounds,
  onBackgroundsChange,
}: BackgroundUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  // Generate preview URLs for uploaded files
  useEffect(() => {
    const urls = backgrounds.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [backgrounds]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );
      onBackgroundsChange([...backgrounds, ...imageFiles]);
    }
    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newBackgrounds = backgrounds.filter((_, i) => i !== index);
    onBackgroundsChange(newBackgrounds);
  };

  const handleClearAll = () => {
    onBackgroundsChange([]);
  };

  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Custom Backgrounds
            </h2>
            <p className="text-sm text-default-500">
              {backgrounds.length > 0
                ? `${backgrounds.length} image${backgrounds.length > 1 ? "s" : ""} selected`
                : "Using default backgrounds"}
            </p>
          </div>
        </div>

        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          color="default"
          variant="bordered"
          className="w-full mb-4"
          onPress={() => fileInputRef.current?.click()}
        >
          Add Background Images
        </Button>

        {/* Preview grid */}
        {backgrounds.length > 0 && (
          <>
            <div className="max-h-40 overflow-y-auto border border-default-200 rounded-lg p-2">
              <div className="grid grid-cols-4 gap-2">
                {previews.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Background ${index + 1}`}
                      className="w-full h-16 object-cover rounded"
                    />
                    <button
                      onClick={() => handleRemove(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              color="danger"
              variant="light"
              size="sm"
              className="w-full mt-2"
              onPress={handleClearAll}
            >
              Clear All & Use Defaults
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
