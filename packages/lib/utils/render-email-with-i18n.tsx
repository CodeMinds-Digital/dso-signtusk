import type { RenderOptions } from "@signtusk/email/render";
import { renderWithI18N } from "@signtusk/email/render";

import { getI18nInstance } from "../client-only/providers/i18n-server";
import {
  APP_I18N_OPTIONS,
  isValidLanguageCode,
  type SupportedLanguageCodes,
} from "../constants/i18n";

// Extend options to include lang and branding
export type RenderEmailOptions = Omit<RenderOptions, "i18n"> & {
  // eslint-disable-next-line @typescript-eslint/ban-types
  lang?: SupportedLanguageCodes | (string & {});
  branding?: any; // Accept branding but ignore it for now
};

/**
 * Render email with i18n support.
 *
 * IMPORTANT: Email templates should NOT use useLingui() or other React hooks.
 * Instead, pass the i18n instance as a prop and use i18n._ directly, or use
 * the t macro from @lingui/macro which works at compile time.
 *
 * @param component - The email component to render
 * @param options - Rendering options including language
 * @returns Rendered HTML string
 */
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

    // Activate the language BEFORE rendering
    i18n.activate(lang);

    // Use renderWithI18N which does NOT wrap in I18nProvider
    // (I18nProvider uses React hooks which fail in @react-email/render's SSR context)
    return renderWithI18N(component, { i18n, branding, ...otherOptions });
  } catch (err) {
    console.error("[renderEmailWithI18N] Error:", err);
    throw new Error("Failed to render email");
  }
};
