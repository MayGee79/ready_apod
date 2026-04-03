"use client";

import { useMemo, useState } from "react";
import {
  Document,
  Image,
  Page,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

export type CoverPdfExportLayout = {
  trimSize: string;
  pageCount: number;
  spineWidthIn: number;
  fullWidthIn: number;
  fullHeightIn: number;
  trimWidthIn: number;
  trimHeightIn: number;
};

type Props = {
  layout: CoverPdfExportLayout;
  uploadedImageFile: File | null;
  disabled?: boolean;
};

const BLEED_IN = 0.125;
const SAFE_INSET_FROM_BLEED_IN = 0.25;

export default function CoverPdfExportButton({
  layout,
  uploadedImageFile,
  disabled,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const isValid = useMemo(() => layout.spineWidthIn > 0, [layout.spineWidthIn]);

  async function onExport() {
    if (disabled || !isValid) return;
    setIsGenerating(true);

    try {
      const imageDataUrl = uploadedImageFile
        ? await fileToBase64(uploadedImageFile)
        : null;

      const doc = (
        <CoverPdfDocument layout={layout} imageDataUrl={imageDataUrl} />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `cover-${layout.trimSize}-${layout.pageCount}p.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={disabled || !isValid || isGenerating}
      className="h-11 rounded-xl bg-[color:var(--primary)] px-4 text-sm font-medium text-[color:var(--background)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isGenerating ? "Generating…" : "Export PDF"}
    </button>
  );
}

function CoverPdfDocument({
  layout,
  imageDataUrl,
}: {
  layout: CoverPdfExportLayout;
  imageDataUrl: string | null;
}) {
  const widthPt = inToPt(layout.fullWidthIn);
  const heightPt = inToPt(layout.fullHeightIn);

  const bleedInsetPt = inToPt(BLEED_IN);
  const safeInsetPt = inToPt(BLEED_IN + SAFE_INSET_FROM_BLEED_IN);

  const panelTopPt = bleedInsetPt;
  const panelHeightPt = inToPt(layout.trimHeightIn);
  const panelWidthPt = inToPt(layout.trimWidthIn);
  const spineWidthPt = inToPt(layout.spineWidthIn);

  const backLeftPt = bleedInsetPt;
  const spineLeftPt = bleedInsetPt + panelWidthPt;
  const frontLeftPt = spineLeftPt + spineWidthPt;

  return (
    <Document>
      <Page
        size={{ width: widthPt, height: heightPt }}
        style={{
          position: "relative",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Zones */}
        <View
          style={{
            position: "absolute",
            left: backLeftPt,
            top: panelTopPt,
            width: panelWidthPt,
            height: panelHeightPt,
            backgroundColor: "rgba(28,28,46,0.03)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: spineLeftPt,
            top: panelTopPt,
            width: Math.max(1, spineWidthPt),
            height: panelHeightPt,
            backgroundColor: "rgba(196,98,45,0.05)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: frontLeftPt,
            top: panelTopPt,
            width: panelWidthPt,
            height: panelHeightPt,
            backgroundColor: "rgba(28,28,46,0.03)",
          }}
        />

        {/* Image overlay (optional) */}
        {imageDataUrl ? (
          <Image
            src={imageDataUrl}
            alt=""
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: widthPt,
              height: heightPt,
              objectFit: "cover",
            }}
          />
        ) : null}

        {/* Bleed boundary (trim line) */}
        <View
          style={{
            position: "absolute",
            left: bleedInsetPt,
            top: bleedInsetPt,
            width: widthPt - bleedInsetPt * 2,
            height: heightPt - bleedInsetPt * 2,
            borderWidth: 2,
            borderColor: "rgba(166,61,47,0.85)",
            borderStyle: "dashed",
          }}
        />

        {/* Safe zone boundary */}
        <View
          style={{
            position: "absolute",
            left: safeInsetPt,
            top: safeInsetPt,
            width: widthPt - safeInsetPt * 2,
            height: heightPt - safeInsetPt * 2,
            borderWidth: 2,
            borderColor: "rgba(28,90,196,0.75)",
            borderStyle: "dashed",
          }}
        />

        {/* Labels */}
        <Text
          style={{
            position: "absolute",
            left: backLeftPt + 10,
            top: panelTopPt + 10,
            fontSize: 12,
            color: "rgba(28,28,46,0.70)",
          }}
        >
          Back
        </Text>
        <Text
          style={{
            position: "absolute",
            left: spineLeftPt + 10,
            top: panelTopPt + 10,
            fontSize: 12,
            color: "rgba(28,28,46,0.70)",
          }}
        >
          Spine
        </Text>
        <Text
          style={{
            position: "absolute",
            left: frontLeftPt + 10,
            top: panelTopPt + 10,
            fontSize: 12,
            color: "rgba(28,28,46,0.70)",
          }}
        >
          Front
        </Text>
      </Page>
    </Document>
  );
}

function inToPt(inches: number) {
  return inches * 72;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

