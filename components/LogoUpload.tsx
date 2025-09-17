"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

interface LogoUploadProps {
  uploadedFile: File | null;
  onFileUpload: (file: File) => void;
  onUploadNewLogo: () => void;
}

export default function LogoUpload({ uploadedFile, onFileUpload, onUploadNewLogo }: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false);

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
      <CardBody className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Logo</h2>
        {!uploadedFile ? (
          <div
            className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all ${
              dragActive ? "border-blue-500 bg-blue-50 scale-105" : "hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
          >
            <div className="w-12 h-12 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload your logo</h3>
            <p className="text-gray-500 mb-4">(PNG, SVG, JPG – transparent works best)</p>
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
                className="cursor-pointer"
              >
                Choose File
              </Button>
            </label>
          </div>
        ) : (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">Logo uploaded successfully</p>
              </div>
            </div>
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