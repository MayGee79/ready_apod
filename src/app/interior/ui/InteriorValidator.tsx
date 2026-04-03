"use client";

import Script from "next/script";
import { useMemo, useState } from "react";
import { TRIM_SIZES } from "@/lib/kdp/trimSizes";

type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: Uint8Array }) => {
    promise: Promise<PdfDocument>;
  };
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};

type PdfPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  getTextContent: () => Promise<{
    items: Array<{ fontName?: string }>;
    styles: Record<string, unknown>;
  }>;
  getOperatorList: () => Promise<{
    fnArray: number[];
    argsArray: unknown[];
  }>;
  // PDF.js runtime objects; not in types here, but exists.
  objs?: {
    get: (
      name: string,
      callback?: (obj: { width?: number; height?: number }) => void,
    ) => unknown;
  };
};

type CheckResult = {
  id: "pageSize" | "pageCount" | "fontEmbedding" | "imageResolution";
  label: string;
  passed: boolean;
  message: string;
  pages?: number[];
};

const PDFJS_VERSION = "4.10.38";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

const PAGE_SIZE_TOLERANCE_IN = 0.01;
const MIN_IMAGE_DPI = 300;

export default function InteriorValidator() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [trimSize, setTrimSize] = useState(TRIM_SIZES[3]?.value ?? "6x9");
  const [expectedPages, setExpectedPages] = useState<number>(300);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [pdfJsReady, setPdfJsReady] = useState(false);

  const trim = useMemo(() => {
    return TRIM_SIZES.find((t) => t.value === trimSize) ?? TRIM_SIZES[3]!;
  }, [trimSize]);

  async function run() {
    setFatalError(null);
    setResults(null);

    if (!pdfFile) {
      setFatalError("Please upload a PDF first.");
      return;
    }
    if (!pdfJsReady) {
      setFatalError("PDF.js is still loading. Try again in a moment.");
      return;
    }

    const pdfjsLib = (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib;
    if (!pdfjsLib) {
      setFatalError("PDF.js failed to load from CDN.");
      return;
    }

    setIsRunning(true);
    try {
      const data = new Uint8Array(await pdfFile.arrayBuffer());

      pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      const doc = await pdfjsLib.getDocument({ data }).promise;

      const checks: CheckResult[] = [];

      // 1) Page count match
      checks.push(checkPageCount(doc.numPages, expectedPages));

      // 2) Page size match (all pages)
      const pageSize = await checkPageSizes(doc, {
        expectedWidthIn: trim.widthIn,
        expectedHeightIn: trim.heightIn,
      });
      checks.push(pageSize);

      // 3) Font embedding (best-effort)
      const fonts = await checkFontEmbeddingBestEffort(doc);
      checks.push(fonts);

      // 4) Image resolution (best-effort)
      const images = await checkImageResolutionBestEffort(doc);
      checks.push(images);

      setResults(checks);
    } catch (e) {
      setFatalError(e instanceof Error ? e.message : "Unknown error while reading PDF.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <Script
        src={`${PDFJS_CDN}/pdf.min.js`}
        strategy="afterInteractive"
        onLoad={() => setPdfJsReady(true)}
        onError={() => setFatalError("Failed to load PDF.js from CDN.")}
      />

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <div className="grid gap-4">
          <Field id="pdf" label="Interior PDF">
            <input
              id="pdf"
              aria-label="Upload interior PDF"
              title="Upload interior PDF"
              className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-black/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-black/15 dark:file:bg-white/10 dark:file:text-white dark:hover:file:bg-white/15"
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                setPdfFile(e.target.files?.[0] ?? null);
                setResults(null);
                setFatalError(null);
              }}
            />
          </Field>

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

          <Field id="pages" label="Expected page count">
            <input
              id="pages"
              aria-label="Expected page count"
              title="Expected page count"
              className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 text-sm dark:bg-black/30"
              type="number"
              min={1}
              value={Number.isFinite(expectedPages) ? expectedPages : 0}
              onChange={(e) => setExpectedPages(Math.max(1, Number(e.target.value)))}
            />
          </Field>

          <button
            type="button"
            onClick={run}
            disabled={isRunning}
            className="mt-1 h-11 rounded-xl bg-[color:var(--primary)] px-4 text-sm font-medium text-[color:var(--background)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? "Running checks…" : "Run checks"}
          </button>

          <p className="text-xs leading-5 text-black/60 dark:text-white/60">
            All checks run locally in your browser. Font embedding and image DPI are best-effort via
            PDF.js (some PDFs may limit inspection).
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl tracking-tight">Validation report</h2>
          <div className="text-sm text-black/60 dark:text-white/60">
            {trim.widthIn}&quot; × {trim.heightIn}&quot;
          </div>
        </div>

        {fatalError && (
          <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-white/60 p-4 text-sm text-[color:var(--error)] dark:bg-black/20">
            {fatalError}
          </div>
        )}

        {!fatalError && !results && (
          <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-white/60 p-4 text-sm text-black/70 dark:bg-black/20 dark:text-white/70">
            Upload a PDF, set trim + expected pages, then run checks.
          </div>
        )}

        {results && (
          <ul className="mt-4 grid gap-2">
            {results.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-[color:var(--border)] bg-white/60 p-4 text-sm dark:bg-black/20"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot passed={r.passed} />
                    <div className="font-medium">{r.label}</div>
                  </div>
                  <div className="mt-1 text-black/70 dark:text-white/70">{r.message}</div>
                  {r.pages?.length ? (
                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                      Pages: {formatPages(r.pages)}
                    </div>
                  ) : null}
                </div>
                <div
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    r.passed
                      ? "bg-[color:rgba(107,143,113,0.18)] text-[color:var(--success)]"
                      : "bg-[color:rgba(166,61,47,0.12)] text-[color:var(--error)]"
                  }`}
                >
                  {r.passed ? "PASS" : "FAIL"}
                </div>
              </li>
            ))}
          </ul>
        )}
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

function StatusDot({ passed }: { passed: boolean }) {
  const dotClass = passed
    ? "bg-[color:var(--success)] shadow-[0_0_0_3px_rgba(107,143,113,0.15)]"
    : "bg-[color:var(--error)] shadow-[0_0_0_3px_rgba(166,61,47,0.12)]";

  return (
    <span
      className={`mt-0.5 inline-block h-2.5 w-2.5 rounded-full ${dotClass}`}
      aria-hidden="true"
    />
  );
}

function checkPageCount(actual: number, expected: number): CheckResult {
  if (actual === expected) {
    return {
      id: "pageCount",
      label: "Page count match",
      passed: true,
      message: `PDF has ${actual} pages (matches expected).`,
    };
  }
  return {
    id: "pageCount",
    label: "Page count match",
    passed: false,
    message: `PDF has ${actual} pages; expected ${expected}.`,
  };
}

async function checkPageSizes(
  doc: PdfDocument,
  input: { expectedWidthIn: number; expectedHeightIn: number },
): Promise<CheckResult> {
  const failing: number[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const wIn = vp.width / 72;
    const hIn = vp.height / 72;

    const ok =
      nearlyEqual(wIn, input.expectedWidthIn, PAGE_SIZE_TOLERANCE_IN) &&
      nearlyEqual(hIn, input.expectedHeightIn, PAGE_SIZE_TOLERANCE_IN);

    if (!ok) failing.push(i);
  }

  if (failing.length === 0) {
    return {
      id: "pageSize",
      label: "Page size match",
      passed: true,
      message: `All pages match ${input.expectedWidthIn}" × ${input.expectedHeightIn}" (±${PAGE_SIZE_TOLERANCE_IN}").`,
    };
  }

  return {
    id: "pageSize",
    label: "Page size match",
    passed: false,
    message: `Some pages do not match ${input.expectedWidthIn}" × ${input.expectedHeightIn}" (±${PAGE_SIZE_TOLERANCE_IN}").`,
    pages: failing,
  };
}

async function checkFontEmbeddingBestEffort(doc: PdfDocument): Promise<CheckResult> {
  // PDF.js doesn’t expose a perfect “embedded vs not” API in all cases.
  // Best-effort heuristic: if we can extract text and resolve any font names, we report pass;
  // if pages contain text items but no font names can be resolved, we fail.
  let pagesWithText = 0;
  let resolvedFontNames = 0;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const fontNames = new Set(tc.items.map((it) => it.fontName).filter(Boolean) as string[]);

    if (tc.items.length > 0) pagesWithText++;
    resolvedFontNames += fontNames.size;
  }

  if (pagesWithText === 0) {
    return {
      id: "fontEmbedding",
      label: "Font embedding",
      passed: true,
      message: "No extractable text detected (nothing to validate for embedding).",
    };
  }

  if (resolvedFontNames > 0) {
    return {
      id: "fontEmbedding",
      label: "Font embedding",
      passed: true,
      message:
        "Best-effort check: fonts were referenced in extracted text. For absolute certainty, confirm embedding in Acrobat/Preflight.",
    };
  }

  return {
    id: "fontEmbedding",
    label: "Font embedding",
    passed: false,
    message:
      "Best-effort check: text was detected, but font info couldn’t be resolved via PDF.js. Confirm embedding in Acrobat/Preflight.",
  };
}

async function checkImageResolutionBestEffort(doc: PdfDocument): Promise<CheckResult> {
  // Best-effort DPI check by tracking PDF.js operator list:
  // - Track transform matrices.
  // - When painting an image XObject, approximate displayed size in points from CTM scale.
  // - Compute DPI = pixel_dim / (points/72).
  const failingPages: number[] = [];
  let imagesSeen = 0;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const opList = await page.getOperatorList();

    const OPS = (window as unknown as { pdfjsLib?: { OPS?: Record<string, number> } }).pdfjsLib
      ?.OPS;
    if (!OPS) {
      // If OPS isn’t available, we can’t interpret operator list reliably.
      return {
        id: "imageResolution",
        label: "Image resolution",
        passed: true,
        message: "PDF.js OPS table unavailable; skipping image DPI check.",
      };
    }

    // Current transform matrix (a,b,c,d,e,f) in PDF points.
    let ctm: Matrix = [1, 0, 0, 1, 0, 0];
    const stack: Matrix[] = [];

    let pageFailed = false;

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i]!;
      const args = opList.argsArray[i] as unknown[];

      if (fn === OPS.save) {
        stack.push(ctm);
        continue;
      }
      if (fn === OPS.restore) {
        ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
        continue;
      }
      if (fn === OPS.transform) {
        const m = args as number[];
        if (m.length >= 6) ctm = multiply(ctm, [m[0]!, m[1]!, m[2]!, m[3]!, m[4]!, m[5]!]);
        continue;
      }

      const isPaintImage =
        fn === OPS.paintImageXObject ||
        fn === OPS.paintInlineImageXObject ||
        fn === OPS.paintJpegXObject;

      if (!isPaintImage) continue;

      // paintImageXObject args usually: [objId]
      const objId = typeof args?.[0] === "string" ? (args[0] as string) : null;
      if (!objId || !page.objs) continue;

      const image = await getPageObj(page, objId);
      if (!image?.width || !image?.height) continue;

      imagesSeen++;

      const displayedWidthPts = Math.hypot(ctm[0], ctm[1]);
      const displayedHeightPts = Math.hypot(ctm[2], ctm[3]);

      // Guard against degenerate transforms.
      const wIn = displayedWidthPts > 0 ? displayedWidthPts / 72 : 0;
      const hIn = displayedHeightPts > 0 ? displayedHeightPts / 72 : 0;
      if (wIn <= 0 || hIn <= 0) continue;

      const dpiX = image.width / wIn;
      const dpiY = image.height / hIn;
      const dpi = Math.min(dpiX, dpiY);

      if (dpi < MIN_IMAGE_DPI) {
        pageFailed = true;
      }
    }

    if (pageFailed) failingPages.push(pageNum);
  }

  if (imagesSeen === 0) {
    return {
      id: "imageResolution",
      label: "Image resolution",
      passed: true,
      message: "No images detected (nothing to validate for DPI).",
    };
  }

  if (failingPages.length === 0) {
    return {
      id: "imageResolution",
      label: "Image resolution",
      passed: true,
      message: `Best-effort: all detected images appear ≥ ${MIN_IMAGE_DPI} DPI at placement size.`,
    };
  }

  return {
    id: "imageResolution",
    label: "Image resolution",
    passed: false,
    message: `Best-effort: at least one image appears < ${MIN_IMAGE_DPI} DPI at its placed size.`,
    pages: failingPages,
  };
}

type Matrix = [number, number, number, number, number, number];

function multiply(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

function nearlyEqual(a: number, b: number, tol: number) {
  return Math.abs(a - b) <= tol;
}

function formatPages(pages: number[]) {
  // compact: "1, 2, 5–7"
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: Array<[number, number]> = [];
  for (const p of sorted) {
    const last = ranges[ranges.length - 1];
    if (!last || p > last[1] + 1) ranges.push([p, p]);
    else last[1] = p;
  }
  return ranges
    .map(([s, e]) => (s === e ? String(s) : `${s}–${e}`))
    .join(", ");
}

function getPageObj(page: PdfPage, name: string): Promise<{ width?: number; height?: number } | null> {
  return new Promise((resolve) => {
    if (!page.objs) return resolve(null);
    try {
      const maybe = page.objs.get(name);
      if (maybe && typeof maybe === "object") return resolve(maybe as { width?: number; height?: number });
    } catch {
      // ignore
    }
    try {
      page.objs.get(name, (obj) => resolve(obj ?? null));
    } catch {
      resolve(null);
    }
  });
}

