"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

interface LogoUploadProps {
  uploadedFile: File | null;
  onFileUpload: (file: File) => void;
  onUploadNewLogo: () => void;
}

export default function LogoUpload({ uploadedFile, onFileUpload, onUploadNewLogo }: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview URL when file changes
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadedFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <Card>
      <CardBody className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Logo</h2>
        {!uploadedFile ? (
          <div
            className={`border-2 border-dashed border-default-300 rounded-lg p-4 text-center transition-all ${
              dragActive ? "border-primary bg-primary-50 scale-105" : "hover:border-default-400"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
          >
            <div className="w-10 h-10 mx-auto bg-default-200 rounded-full flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-default-500 mb-3">PNG, SVG, JPG</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                as="span"
                color="primary"
                size="sm"
                className="cursor-pointer"
              >
                Choose File
              </Button>
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {previewUrl && (
              <div className="w-20 h-20 mb-3 flex items-center justify-center bg-default-100 rounded-lg p-2">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <Button
              size="sm"
              variant="flat"
              onPress={onUploadNewLogo}
              className="w-full"
            >
              Change Logo
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}