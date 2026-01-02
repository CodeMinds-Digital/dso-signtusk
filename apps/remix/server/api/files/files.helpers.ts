import { DocumentStatus, type DocumentDataType } from "@prisma/client";
import contentDisposition from "content-disposition";
import { type Context } from "hono";

import { sha256 } from "@signtusk/lib/universal/crypto";
import { getFileServerSide } from "@signtusk/lib/universal/upload/get-file.server";

import type { HonoEnv } from "../../router";

type HandleEnvelopeItemFileRequestOptions = {
  title: string;
  status: DocumentStatus;
  documentData: {
    type: DocumentDataType;
    data: string;
    initialData: string;
  };
  version: "signed" | "original";
  isDownload: boolean;
  context: Context<HonoEnv>;
};

/**
 * Helper function to handle envelope item file requests (both view and download)
 */
export const handleEnvelopeItemFileRequest = async ({
  title,
  status,
  documentData,
  version,
  isDownload,
  context: c,
}: HandleEnvelopeItemFileRequestOptions) => {
  const documentDataToUse =
    version === "signed" ? documentData.data : documentData.initialData;

  const etag = Buffer.from(sha256(documentDataToUse)).toString("hex");

  if (c.req.header("If-None-Match") === etag && !isDownload) {
    return c.body(null, 304);
  }

  const file = await getFileServerSide({
    type: documentData.type,
    data: documentDataToUse,
  }).catch((error) => {
    console.error(error);

    return null;
  });

  if (!file) {
    return c.json({ error: "File not found" }, 404);
  }

  return c.body(file as Uint8Array, 200, {
    "Content-Type": "application/pdf",
    ETag: etag,
    ...(isDownload && {
      "Content-Disposition": contentDisposition(
        `${title.replace(/\.pdf$/, "")}${version === "signed" ? "_signed.pdf" : ".pdf"}`
      ),
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    }),
    ...(!isDownload && {
      "Cache-Control":
        status === DocumentStatus.COMPLETED
          ? "public, max-age=31536000, immutable"
          : "public, max-age=0, must-revalidate",
    }),
  });
};
