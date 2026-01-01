// sort-imports-ignore
import "konva/skia-backend";

import Konva from "konva";
import path from "node:path";
import type { Canvas } from "skia-canvas";
import { FontLibrary } from "skia-canvas";

import type { FieldWithSignature } from "@signtusk/prisma/types/field-with-signature";

import { renderField } from "../../universal/field-renderer/render-field";

type InsertFieldInPDFV2Options = {
  pageWidth: number;
  pageHeight: number;
  fields: FieldWithSignature[];
};

// Get current directory in a Vercel-compatible way
const getCurrentDir = () => {
  if (typeof __dirname !== "undefined") {
    // CommonJS environment
    return __dirname;
  }
  // ESM environment - fallback to process.cwd() but with better error handling
  try {
    return process.cwd();
  } catch {
    // In serverless environments, use a relative path
    return ".";
  }
};

export const insertFieldInPDFV2 = async ({
  pageWidth,
  pageHeight,
  fields,
}: InsertFieldInPDFV2Options) => {
  // Use Vercel-compatible path resolution
  const currentDir = getCurrentDir();
  const fontPath = path.join(currentDir, "public/fonts");

  FontLibrary.use({
    ["Caveat"]: [path.join(fontPath, "caveat.ttf")],
    ["Noto Sans"]: [path.join(fontPath, "noto-sans.ttf")],
    ["Noto Sans Japanese"]: [path.join(fontPath, "noto-sans-japanese.ttf")],
    ["Noto Sans Chinese"]: [path.join(fontPath, "noto-sans-chinese.ttf")],
    ["Noto Sans Korean"]: [path.join(fontPath, "noto-sans-korean.ttf")],
  });

  const stage = new Konva.Stage({ width: pageWidth, height: pageHeight });
  const layer = new Konva.Layer();

  // Render the fields onto the layer.
  for (const field of fields) {
    renderField({
      scale: 1,
      field: {
        renderId: field.id.toString(),
        ...field,
        width: Number(field.width),
        height: Number(field.height),
        positionX: Number(field.positionX),
        positionY: Number(field.positionY),
      },
      translations: null,
      pageLayer: layer,
      pageWidth,
      pageHeight,
      mode: "export",
    });
  }

  stage.add(layer);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const canvas = layer.canvas._canvas as unknown as Canvas;

  // Embed the SVG into the PDF
  return await canvas.toBuffer("pdf");
};
