import type { RenderWithI18nWrapperOptions } from "@signtusk/email/render-with-i18n-wrapper";
import { renderWithI18nWrapper } from "@signtusk/email/render-with-i18n-wrapper";

import { getI18nInstance } from "../client-only/providers/i18n-server";
import {
  APP_I18N_OPTIONS,
  isValidLanguageCode,
  type SupportedLanguageCodes,
} from "../constants/i18n";

// Extend options to include lang and branding
export type RenderEmailOptions = Omit<RenderWithI18nWrapperOptions, "i18n"> & {
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

    // Use renderWithI18nWrapper which properly wraps in I18nProvider
    // This allows useLingui() hooks to work in email templates
    return renderWithI18nWrapper(component, { i18n, ...otherOptions });
  } catch (err) {
    console.error(err);
    throw new Error("Failed to render email");
  }
};
