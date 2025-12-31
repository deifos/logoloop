"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Slider } from "@heroui/slider";
import { Switch } from "@heroui/switch";
import { ButtonGroup } from "@heroui/button";

interface SettingsPanelProps {
  logoSize: number;
  speed: number;
  enableVariations: boolean;
  enableStickerBorder: boolean;
  resizeMode: boolean;
  aspectRatio: "16:9" | "9:16" | "1:1";
  isProcessing: boolean;
  onLogoSizeChange: (size: number) => void;
  onSpeedChange: (speed: number) => void;
  onVariationsChange: (enabled: boolean) => void;
  onStickerBorderChange: (enabled: boolean) => void;
  onResizeModeChange: (enabled: boolean) => void;
  onAspectRatioChange: (ratio: "16:9" | "9:16" | "1:1") => void;
  onGenerateVideo: () => void;
}

export default function SettingsPanel({
  logoSize,
  speed,
  enableVariations,
  enableStickerBorder,
  resizeMode,
  aspectRatio,
  isProcessing,
  onLogoSizeChange,
  onSpeedChange,
  onVariationsChange,
  onStickerBorderChange,
  onResizeModeChange,
  onAspectRatioChange,
  onGenerateVideo
}: SettingsPanelProps) {
  const handleSpeedChange = (value: number | number[]) => {
    const newSpeed = Array.isArray(value) ? value[0] : value;
    onSpeedChange(newSpeed);
  };

  return (
    <Card>
      <CardBody className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Settings</h2>

        <div className="space-y-3">
          {/* Speed Control */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Speed: {speed}%
            </label>
            <Slider
              size="sm"
              value={speed}
              onChange={handleSpeedChange}
              minValue={10}
              maxValue={100}
              step={5}
              className="w-full"
              color="primary"
            />
          </div>

          {/* Resize Logo Mode */}
          <div className="flex justify-between items-center py-1">
            <p className="text-sm font-medium text-gray-900">
              Resize Logo {resizeMode && <span className="text-gray-500">({logoSize}%)</span>}
            </p>
            <Switch
              size="sm"
              isSelected={resizeMode}
              onValueChange={onResizeModeChange}
              color="primary"
            />
          </div>

          {/* Enable Variations */}
          <div className="flex justify-between items-center py-1">
            <p className="text-sm font-medium text-gray-900">Animation Effects</p>
            <Switch
              size="sm"
              isSelected={enableVariations}
              onValueChange={onVariationsChange}
              color="primary"
            />
          </div>

          {/* Sticker Border */}
          <div className="flex justify-between items-center py-1">
            <p className="text-sm font-medium text-gray-900">Sticker Border</p>
            <Switch
              size="sm"
              isSelected={enableStickerBorder}
              onValueChange={onStickerBorderChange}
              color="primary"
            />
          </div>

          {/* Aspect Ratio */}
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">Aspect Ratio</p>
            <ButtonGroup className="w-full" size="sm">
              <Button
                className="flex-1"
                color={aspectRatio === "16:9" ? "primary" : "default"}
                variant={aspectRatio === "16:9" ? "solid" : "bordered"}
                onPress={() => onAspectRatioChange("16:9")}
              >
                16:9
              </Button>
              <Button
                className="flex-1"
                color={aspectRatio === "9:16" ? "primary" : "default"}
                variant={aspectRatio === "9:16" ? "solid" : "bordered"}
                onPress={() => onAspectRatioChange("9:16")}
              >
                9:16
              </Button>
              <Button
                className="flex-1"
                color={aspectRatio === "1:1" ? "primary" : "default"}
                variant={aspectRatio === "1:1" ? "solid" : "bordered"}
                onPress={() => onAspectRatioChange("1:1")}
              >
                1:1
              </Button>
            </ButtonGroup>
          </div>

          {/* Generate Button */}
          <Button
            color="primary"
            size="md"
            className="w-full mt-2"
            onPress={onGenerateVideo}
            isDisabled={isProcessing}
          >
            {isProcessing ? "Generating..." : "Generate Video"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}