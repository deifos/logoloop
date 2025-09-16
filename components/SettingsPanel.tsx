"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Slider } from "@heroui/slider";
import { Switch } from "@heroui/switch";

interface SettingsPanelProps {
  logoSize: number;
  enableVariations: boolean;
  isProcessing: boolean;
  onLogoSizeChange: (size: number) => void;
  onVariationsChange: (enabled: boolean) => void;
  onGenerateVideo: () => void;
}

export default function SettingsPanel({
  logoSize,
  enableVariations,
  isProcessing,
  onLogoSizeChange,
  onVariationsChange,
  onGenerateVideo
}: SettingsPanelProps) {
  const handleSliderChange = (value: number | number[]) => {
    const newSize = Array.isArray(value) ? value[0] : value;
    onLogoSizeChange(newSize);
  };

  return (
    <Card>
      <CardBody className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>

        <div className="space-y-6">
          {/* Logo Size */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Logo Size: {logoSize}%
            </label>
            <Slider
              size="md"
              value={logoSize}
              onChange={handleSliderChange}
              minValue={2}
              maxValue={20}
              step={1}
              className="w-full"
              color="primary"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Tiny</span>
              <span>Large</span>
            </div>
          </div>

          {/* Enable Variations */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">Animation Effects</p>
              <p className="text-sm text-gray-500">Random wiggling and size changes</p>
            </div>
            <Switch
              isSelected={enableVariations}
              onValueChange={onVariationsChange}
              color="primary"
            />
          </div>

          {/* Generate Button */}
          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={onGenerateVideo}
            isDisabled={isProcessing}
          >
            {isProcessing ? "Generating Video..." : "Generate Video"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}