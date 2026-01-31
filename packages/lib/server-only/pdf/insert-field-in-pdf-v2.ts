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

export const insertFieldInPDFV2 = async ({
  pageWidth,
  pageHeight,
  fields,
}: InsertFieldInPDFV2Options) => {
  // In Docker, process.cwd() is /app/apps/remix, so fonts are at public/fonts
  // In development, process.cwd() is /app, so fonts are at public/fonts
  const fontPath = path.join(process.cwd(), "public/fonts");

  FontLibrary.use({
    ["Dancing Script"]: [path.join(fontPath, "DancingScript-Bold.ttf")],
    ["Noto Sans"]: [path.join(fontPath, "NotoSans-Regular.ttf")],
    ["Noto Sans Japanese"]: [path.join(fontPath, "NotoSansJP-Regular.ttf")],
    ["Noto Sans Chinese"]: [path.join(fontPath, "NotoSansSC-Regular.ttf")],
    ["Noto Sans Korean"]: [path.join(fontPath, "NotoSansKR-Regular.ttf")],
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
