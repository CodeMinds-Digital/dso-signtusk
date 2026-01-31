import type { SimpleRenderOptions } from "@signtusk/email/render-simple";
import { renderSimple } from "@signtusk/email/render-simple";

import { getI18nInstance } from "../client-only/providers/i18n-server";
import {
  APP_I18N_OPTIONS,
  isValidLanguageCode,
  type SupportedLanguageCodes,
} from "../constants/i18n";

// Extend SimpleRenderOptions to include branding and lang
export type RenderEmailOptions = SimpleRenderOptions & {
  // eslint-disable-next-line @typescript-eslint/ban-types
  lang?: SupportedLanguageCodes | (string & {});
  branding?: any; // Accept branding but ignore it for now
};

export const renderEmailWithI18N = async (
  component: React.ReactElement,
  options?: RenderEmailOptions
) => {
  try {
    const { lang: providedLang, branding, ...otherOptions } = options ?? {};

    const lang = isValidLanguageCode(providedLang)
      ? providedLang
      : APP_I18N_OPTIONS.sourceLang;

    const i18n = await getI18nInstance(lang);

    i18n.activate(lang);

    // Use renderSimple to avoid React context issues with I18nProvider in serverless environments
    // Note: branding is ignored in simple render mode
    return renderSimple(component, otherOptions);
  } catch (err) {
    console.error(err);
    throw new Error("Failed to render email");
  }
};
