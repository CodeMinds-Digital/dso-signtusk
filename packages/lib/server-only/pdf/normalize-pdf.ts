import { PDFDocument } from "@cantoo/pdf-lib";

import { AppError } from "../../errors/app-error";
import { flattenAnnotations } from "./flatten-annotations";
import { flattenForm, removeOptionalContentGroups } from "./flatten-form";

export const normalizePdf = async (pdf: Buffer) => {
  console.log(
    "[NORMALIZE_PDF] Starting PDF normalization, buffer size:",
    pdf.length
  );

  const pdfDoc = await PDFDocument.load(pdf).catch((e) => {
    console.error(`[NORMALIZE_PDF] PDF load error: ${e.message}`);

    throw new AppError("INVALID_DOCUMENT_FILE", {
      message: "The document is not a valid PDF",
    });
  });

  console.log("[NORMALIZE_PDF] PDF loaded successfully");

  if (pdfDoc.isEncrypted) {
    console.error("[NORMALIZE_PDF] PDF is encrypted");
    throw new AppError("INVALID_DOCUMENT_FILE", {
      message: "The document is encrypted",
    });
  }

  try {
    console.log("[NORMALIZE_PDF] Removing optional content groups");
    removeOptionalContentGroups(pdfDoc);

    console.log("[NORMALIZE_PDF] Flattening form");
    await flattenForm(pdfDoc);

    console.log("[NORMALIZE_PDF] Flattening annotations");
    flattenAnnotations(pdfDoc);

    console.log("[NORMALIZE_PDF] Saving PDF");
    const result = Buffer.from(await pdfDoc.save());
    console.log(
      "[NORMALIZE_PDF] PDF normalized successfully, output size:",
      result.length
    );

    return result;
  } catch (error) {
    console.error("[NORMALIZE_PDF] Error during normalization:", error);
    // Return original PDF if normalization fails
    console.log("[NORMALIZE_PDF] Returning original PDF due to error");
    return pdf;
  }
};
