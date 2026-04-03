"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TRIM_SIZES } from "@/lib/kdp/trimSizes";
import {
  calculateSpineWidthInches,
  type BindingType,
  type PaperType,
} from "@/lib/kdp/spineCalculator";
import CoverPdfExportButton from "./CoverPdfExport";

type Fabric = typeof import("fabric");

type GuideData = { isGuide?: boolean };

const BLEED_IN = 0.125;
const SAFE_INSET_FROM_BLEED_IN = 0.25; // safe zone is 0.25" inside the bleed line

const UI_PX_PER_INCH = 120; // UI scale (not print DPI)
const MAX_CANVAS_RENDER_PX = 1100; // cap rendered size; we scale viewport to fit

export default function CoverBuilder() {
  const [trimSize, setTrimSize] = useState(TRIM_SIZES[3]?.value ?? "6x9");
  const [pageCount, setPageCount] = useState<number>(300);
  const [paperType, setPaperType] = useState<PaperType>("white");
  const [bindingType] = useState<BindingType>("paperback");
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<import("fabric").Canvas | null>(null);

  const layout = useMemo(() => {
    const trim = TRIM_SIZES.find((t) => t.value === trimSize) ?? TRIM_SIZES[3]!;
    const spineIn = calculateSpineWidthInches({ pageCount, paperType, bindingType });

    const fullWidthIn = trim.widthIn * 2 + spineIn + BLEED_IN * 2;
    const fullHeightIn = trim.heightIn + BLEED_IN * 2;

    const fullWidthPx = inchesToPx(fullWidthIn);
    const fullHeightPx = inchesToPx(fullHeightIn);

    const trimInsetPx = inchesToPx(BLEED_IN);
    const safeInsetPx = inchesToPx(BLEED_IN + SAFE_INSET_FROM_BLEED_IN);

    const backX = trimInsetPx;
    const spineX = trimInsetPx + inchesToPx(trim.widthIn);
    const frontX = spineX + inchesToPx(spineIn);

    return {
      trim,
      spineIn,
      fullWidthIn,
      fullHeightIn,
      fullWidthPx,
      fullHeightPx,
      trimInsetPx,
      safeInsetPx,
      backX,
      spineX,
      frontX,
      panelY: trimInsetPx,
      panelHeightPx: inchesToPx(trim.heightIn),
      panelWidthPx: inchesToPx(trim.widthIn),
      spineWidthPx: inchesToPx(spineIn),
    };
  }, [trimSize, pageCount, paperType, bindingType]);

  useEffect(() => {
    let disposed = false;

    async function init() {
      if (!canvasElRef.current) return;

      const fabricMod: Fabric = await import("fabric");
      if (disposed) return;

      const c = new fabricMod.Canvas(canvasElRef.current, {
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = c;
      redraw(c, fabricMod, layout);
    }

    init();

    return () => {
      disposed = true;
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function rerender() {
      if (!fabricCanvasRef.current) return;
      const fabricMod: Fabric = await import("fabric");
      redraw(fabricCanvasRef.current, fabricMod, layout);
    }
    rerender();
  }, [layout]);

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploadedImageFile(file);
    const c = fabricCanvasRef.current;
    if (!c) return;

    const fabricMod: Fabric = await import("fabric");
    const url = URL.createObjectURL(file);

    try {
      const img = await fabricMod.FabricImage.fromURL(url, {
        crossOrigin: "anonymous",
      });

      img.set({
        left: layout.trimInsetPx,
        top: layout.trimInsetPx,
        selectable: true,
        evented: true,
      });

      // Rough initial fit to the trim height (keeps it usable immediately).
      const targetH = layout.panelHeightPx;
      const scale = img.height ? Math.min(1, targetH / img.height) : 1;
      img.scale(scale);

      // Ensure image sits above guides.
      img.moveTo(50);

      c.add(img);
      c.setActiveObject(img);
      c.requestRenderAll();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <div className="grid gap-4">
          <Field id="trim" label="Trim size">
            <select
              id="trim"
              aria-label="Trim size"
              title="Trim size"
              className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
            >
              {TRIM_SIZES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="pages" label="Pages">
              <input
                id="pages"
                aria-label="Page count"
                title="Page count"
                className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
                type="number"
                min={1}
                value={Number.isFinite(pageCount) ? pageCount : 0}
                onChange={(e) => setPageCount(Math.max(1, Number(e.target.value)))}
              />
            </Field>
            <Field id="paper" label="Paper">
              <select
                id="paper"
                aria-label="Paper type"
                title="Paper type"
                className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as PaperType)}
              >
                <option value="white">White</option>
                <option value="cream">Cream</option>
                <option value="colour">Colour</option>
              </select>
            </Field>
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-white/60 p-4 text-sm leading-6 dark:bg-black/20">
            <div className="flex justify-between gap-3">
              <span>Spine width</span>
              <span className="font-medium">{layout.spineIn.toFixed(4)} in</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Full cover</span>
              <span className="font-medium">
                {layout.fullWidthIn.toFixed(3)}
                &quot; × {layout.fullHeightIn.toFixed(3)}&quot;
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Bleed</span>
              <span className="font-medium">
                {BLEED_IN}&quot; all sides
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Safe zone</span>
              <span className="font-medium">
                {SAFE_INSET_FROM_BLEED_IN}&quot; inside bleed
              </span>
            </div>
          </div>

          <Field id="upload" label="Cover image">
            <input
              id="upload"
              aria-label="Upload a cover image"
              title="Upload a cover image"
              className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-black/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-black/15 dark:file:bg-white/10 dark:file:text-white dark:hover:file:bg-white/15"
              type="file"
              accept="image/*"
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
          </Field>

          <CoverPdfExportButton
            layout={{
              trimSize,
              pageCount,
              spineWidthIn: layout.spineIn,
              fullWidthIn: layout.fullWidthIn,
              fullHeightIn: layout.fullHeightIn,
              trimWidthIn: layout.trim.widthIn,
              trimHeightIn: layout.trim.heightIn,
            }}
            uploadedImageFile={uploadedImageFile}
            disabled={layout.spineIn <= 0}
          />

          <p className="text-xs leading-5 text-black/60 dark:text-white/60">
            Tip: Upload an image, then drag/scale it on the canvas. Guides are locked so you
            can’t accidentally move them.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="overflow-auto rounded-xl bg-white/40 p-3 dark:bg-black/20">
          <canvas ref={canvasElRef} />
        </div>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="grid gap-1">
      <span className="text-xs font-medium text-black/70 dark:text-white/70">{label}</span>
      {children}
    </label>
  );
}

function inchesToPx(inches: number) {
  return Math.round(inches * UI_PX_PER_INCH);
}

function redraw(
  c: import("fabric").Canvas,
  fabric: Fabric,
  layout: {
    fullWidthPx: number;
    fullHeightPx: number;
    trimInsetPx: number;
    safeInsetPx: number;
    backX: number;
    spineX: number;
    frontX: number;
    panelY: number;
    panelHeightPx: number;
    panelWidthPx: number;
    spineWidthPx: number;
  },
) {
  const { Rect, Line, Textbox } = fabric;

  // Preserve user-added objects (images); remove only non-image guide objects.
  const objects = c.getObjects();
  for (const obj of objects) {
    // FabricImage class name varies; safest is: remove anything we locked as a guide.
    if ((obj.data as GuideData | undefined)?.isGuide === true) c.remove(obj);
  }

  // Resize + fit.
  c.setWidth(layout.fullWidthPx);
  c.setHeight(layout.fullHeightPx);

  const fitScale = Math.min(
    1,
    MAX_CANVAS_RENDER_PX / Math.max(layout.fullWidthPx, layout.fullHeightPx),
  );
  c.setViewportTransform([fitScale, 0, 0, fitScale, 0, 0]);

  // Zones (back / spine / front)
  const zoneFill = "rgba(28,28,46,0.03)";
  const spineFill = "rgba(196,98,45,0.05)";

  const back = new Rect({
    left: layout.backX,
    top: layout.panelY,
    width: layout.panelWidthPx,
    height: layout.panelHeightPx,
    fill: zoneFill,
    stroke: "rgba(28,28,46,0.10)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
    objectCaching: false,
    data: { isGuide: true },
  });

  const spine = new Rect({
    left: layout.spineX,
    top: layout.panelY,
    width: Math.max(1, layout.spineWidthPx),
    height: layout.panelHeightPx,
    fill: spineFill,
    stroke: "rgba(28,28,46,0.10)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
    objectCaching: false,
    data: { isGuide: true },
  });

  const front = new Rect({
    left: layout.frontX,
    top: layout.panelY,
    width: layout.panelWidthPx,
    height: layout.panelHeightPx,
    fill: zoneFill,
    stroke: "rgba(28,28,46,0.10)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
    objectCaching: false,
    data: { isGuide: true },
  });

  // Panel divider lines
  const divider1 = new Line([layout.spineX, layout.panelY, layout.spineX, layout.panelY + layout.panelHeightPx], {
    stroke: "rgba(28,28,46,0.25)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
    objectCaching: false,
    data: { isGuide: true },
  });
  const divider2 = new Line([layout.frontX, layout.panelY, layout.frontX, layout.panelY + layout.panelHeightPx], {
    stroke: "rgba(28,28,46,0.25)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
    objectCaching: false,
    data: { isGuide: true },
  });

  // Trim boundary (inside bleed) — red
  const trimRect = new Rect({
    left: layout.trimInsetPx,
    top: layout.trimInsetPx,
    width: layout.fullWidthPx - layout.trimInsetPx * 2,
    height: layout.fullHeightPx - layout.trimInsetPx * 2,
    fill: "transparent",
    stroke: "rgba(166,61,47,0.85)",
    strokeWidth: 2,
    strokeDashArray: [6, 6],
    selectable: false,
    evented: false,
    objectCaching: false,
    data: { isGuide: true },
  });

  // Safe zone boundary — blue
  const safeRect = new Rect({
    left: layout.safeInsetPx,
    top: layout.safeInsetPx,
    width: layout.fullWidthPx - layout.safeInsetPx * 2,
    height: layout.fullHeightPx - layout.safeInsetPx * 2,
    fill: "transparent",
    stroke: "rgba(28,90,196,0.75)",
    strokeWidth: 2,
    strokeDashArray: [10, 6],
    selectable: false,
    evented: false,
    objectCaching: false,
    data: { isGuide: true },
  });

  // Labels
  const labelStyle = {
    fontSize: 14,
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    fill: "rgba(28,28,46,0.7)",
    selectable: false,
    evented: false,
    objectCaching: false,
    data: { isGuide: true },
  } as const;

  const backLabel = new Textbox("Back", {
    ...labelStyle,
    left: layout.backX + 12,
    top: layout.panelY + 12,
    width: 120,
  });
  const spineLabel = new Textbox("Spine", {
    ...labelStyle,
    left: layout.spineX + 12,
    top: layout.panelY + 12,
    width: 120,
  });
  const frontLabel = new Textbox("Front", {
    ...labelStyle,
    left: layout.frontX + 12,
    top: layout.panelY + 12,
    width: 120,
  });

  const bleedLabel = new Textbox("Trim (inside bleed)", {
    ...labelStyle,
    left: layout.trimInsetPx + 12,
    top: layout.trimInsetPx - 26,
    width: 220,
    fill: "rgba(166,61,47,0.85)",
  });

  const safeLabel = new Textbox("Safe zone", {
    ...labelStyle,
    left: layout.safeInsetPx + 12,
    top: layout.safeInsetPx - 26,
    width: 150,
    fill: "rgba(28,90,196,0.75)",
  });

  c.add(back, spine, front, divider1, divider2, trimRect, safeRect, backLabel, spineLabel, frontLabel, bleedLabel, safeLabel);

  // Keep guides behind images.
  for (const obj of c.getObjects()) {
    if ((obj.data as GuideData | undefined)?.isGuide === true) obj.moveTo(0);
  }

  c.requestRenderAll();
}

