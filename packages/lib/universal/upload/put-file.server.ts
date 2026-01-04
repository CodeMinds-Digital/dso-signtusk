import { PDFDocument } from "@cantoo/pdf-lib";
import { base64 } from "@scure/base";
import { DocumentDataType } from "@signtusk/lib/constants/prisma-enums";
import { match } from "ts-pattern";

import { env } from "@signtusk/lib/utils/env";

import { AppError } from "../../errors/app-error";
import { createDocumentData } from "../../server-only/document-data/create-document-data";
import { normalizePdf } from "../../server-only/pdf/normalize-pdf";
import { uploadS3File } from "./server-actions";

type File = {
  name: string;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

/**
 * Uploads a document file to the appropriate storage location and creates
 * a document data record.
 */
export const putPdfFileServerSide = async (file: File) => {
  const isEncryptedDocumentsAllowed = false; // Was feature flag.

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await PDFDocument.load(arrayBuffer).catch((e) => {
    console.error(`PDF upload parse error: ${e.message}`);

    throw new AppError("INVALID_DOCUMENT_FILE");
  });

  if (!isEncryptedDocumentsAllowed && pdf.isEncrypted) {
    throw new AppError("INVALID_DOCUMENT_FILE");
  }

  if (!file.name.endsWith(".pdf")) {
    file.name = `${file.name}.pdf`;
  }

  const { type, data } = await putFileServerSide(file);

  return await createDocumentData({ type, data });
};

/**
 * Uploads a pdf file and normalizes it.
 */
export const putNormalizedPdfFileServerSide = async (file: File) => {
  console.log("[PUT_NORMALIZED_PDF] Starting upload for file:", file.name);

  const buffer = Buffer.from(await file.arrayBuffer());
  console.log("[PUT_NORMALIZED_PDF] Buffer created, size:", buffer.length);

  const normalized = await normalizePdf(buffer);
  console.log("[PUT_NORMALIZED_PDF] PDF normalized, size:", normalized.length);

  const fileName = file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`;

  const documentData = await putFileServerSide({
    name: fileName,
    type: "application/pdf",
    arrayBuffer: async () => Promise.resolve(normalized),
  });
  console.log("[PUT_NORMALIZED_PDF] File uploaded, type:", documentData.type);

  return await createDocumentData({
    type: documentData.type,
    data: documentData.data,
  });
};

/**
 * Uploads a file to the appropriate storage location.
 */
export const putFileServerSide = async (file: File) => {
  const NEXT_PUBLIC_UPLOAD_TRANSPORT = env("NEXT_PUBLIC_UPLOAD_TRANSPORT");
  console.log(
    "[PUT_FILE] Upload transport:",
    NEXT_PUBLIC_UPLOAD_TRANSPORT || "database (default)"
  );

  return await match(NEXT_PUBLIC_UPLOAD_TRANSPORT)
    .with("s3", async () => {
      console.log("[PUT_FILE] Using S3 storage");
      return putFileInS3(file);
    })
    .otherwise(async () => {
      console.log("[PUT_FILE] Using database storage");
      return putFileInDatabase(file);
    });
};

const putFileInDatabase = async (file: File) => {
  const contents = await file.arrayBuffer();

  const binaryData = new Uint8Array(contents);

  const asciiData = base64.encode(binaryData);

  return {
    type: DocumentDataType.BYTES_64,
    data: asciiData,
  };
};

const putFileInS3 = async (file: File) => {
  const buffer = await file.arrayBuffer();

  const blob = new Blob([buffer], { type: file.type });

  const newFile = new File([blob], file.name, {
    type: file.type,
  });

  const { key } = await uploadS3File(newFile);

  return {
    type: DocumentDataType.S3_PATH,
    data: key,
  };
};
