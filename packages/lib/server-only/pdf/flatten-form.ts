import type { PDFField, PDFWidgetAnnotation } from "@cantoo/pdf-lib";
import {
  PDFCheckBox,
  PDFDict,
  PDFName,
  PDFRadioGroup,
  PDFRef,
  drawObject,
  popGraphicsState,
  pushGraphicsState,
  rotateInPlace,
  translate,
  type PDFDocument,
} from "@cantoo/pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import { NEXT_PRIVATE_INTERNAL_WEBAPP_URL } from "../../constants/app";

export const removeOptionalContentGroups = (document: PDFDocument) => {
  const context = document.context;
  const catalog = context.lookup(context.trailerInfo.Root);
  if (catalog instanceof PDFDict) {
    catalog.delete(PDFName.of("OCProperties"));
  }
};

export const flattenForm = async (document: PDFDocument) => {
  removeOptionalContentGroups(document);

  const form = document.getForm();

  // Skip font embedding if there are no form fields
  const fields = form.getFields();
  if (fields.length === 0) {
    return;
  }

  try {
    const fontUrl = `${NEXT_PRIVATE_INTERNAL_WEBAPP_URL()}/fonts/noto-sans.ttf`;
    console.log("[FLATTEN_FORM] Fetching font from:", fontUrl);

    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      console.error(
        `[FLATTEN_FORM] Font fetch failed with status ${fontResponse.status}`
      );
      // Skip form flattening if font is not available
      return;
    }

    const contentType = fontResponse.headers.get("content-type");
    if (
      contentType &&
      !contentType.includes("font") &&
      !contentType.includes("octet-stream")
    ) {
      console.error(`[FLATTEN_FORM] Invalid font content-type: ${contentType}`);
      // Skip form flattening if response is not a font
      return;
    }

    const fontNoto = await fontResponse.arrayBuffer();

    if (fontNoto.byteLength < 1000) {
      console.error(
        `[FLATTEN_FORM] Font file too small: ${fontNoto.byteLength} bytes`
      );
      return;
    }

    document.registerFontkit(fontkit);

    const font = await document.embedFont(fontNoto);

    form.updateFieldAppearances(font);

    for (const field of fields) {
      for (const widget of field.acroField.getWidgets()) {
        flattenWidget(document, field, widget);
      }

      try {
        form.removeField(field);
      } catch (error) {
        console.error("[FLATTEN_FORM] Error removing field:", error);
      }
    }
  } catch (error) {
    console.error("[FLATTEN_FORM] Error during form flattening:", error);
    // Don't throw - just skip form flattening if there's an error
  }
};

const getPageForWidget = (
  document: PDFDocument,
  widget: PDFWidgetAnnotation
) => {
  const pageRef = widget.P();

  let page = document.getPages().find((page) => page.ref === pageRef);

  if (!page) {
    const widgetRef = document.context.getObjectRef(widget.dict);

    if (!widgetRef) {
      return null;
    }

    page = document.findPageForAnnotationRef(widgetRef);

    if (!page) {
      return null;
    }
  }

  return page;
};

const getAppearanceRefForWidget = (
  field: PDFField,
  widget: PDFWidgetAnnotation
) => {
  try {
    const normalAppearance = widget.getNormalAppearance();
    let normalAppearanceRef: PDFRef | null = null;

    if (normalAppearance instanceof PDFRef) {
      normalAppearanceRef = normalAppearance;
    }

    if (
      normalAppearance instanceof PDFDict &&
      (field instanceof PDFCheckBox || field instanceof PDFRadioGroup)
    ) {
      const value = field.acroField.getValue();
      const ref =
        normalAppearance.get(value) ?? normalAppearance.get(PDFName.of("Off"));

      if (ref instanceof PDFRef) {
        normalAppearanceRef = ref;
      }
    }

    return normalAppearanceRef;
  } catch (error) {
    console.error(error);

    return null;
  }
};

const flattenWidget = (
  document: PDFDocument,
  field: PDFField,
  widget: PDFWidgetAnnotation
) => {
  try {
    const page = getPageForWidget(document, widget);

    if (!page) {
      return;
    }

    const appearanceRef = getAppearanceRefForWidget(field, widget);

    if (!appearanceRef) {
      return;
    }

    const xObjectKey = page.node.newXObject("FlatWidget", appearanceRef);

    const rectangle = widget.getRectangle();
    const operators = [
      pushGraphicsState(),
      translate(rectangle.x, rectangle.y),
      ...rotateInPlace({ ...rectangle, rotation: 0 }),
      drawObject(xObjectKey),
      popGraphicsState(),
    ].filter((op) => !!op);

    page.pushOperators(...operators);
  } catch (error) {
    console.error(error);
  }
};
