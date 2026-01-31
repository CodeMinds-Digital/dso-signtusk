/**
 * Wrapper to render email templates with i18n support without React context issues.
 *
 * This creates a mock React context for @lingui/react hooks to work during SSR.
 */
import { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import * as ReactEmail from "@react-email/render";
import React from "react";

export type RenderWithI18nWrapperOptions = ReactEmail.Options & {
  i18n: I18n;
};

/**
 * Render email with I18n context properly initialized.
 * This wraps the component in I18nProvider so useLingui() works.
 */
export const renderWithI18nWrapper = async (
  element: React.ReactNode,
  options: RenderWithI18nWrapperOptions
) => {
  const { i18n, ...otherOptions } = options;

  // Wrap in I18nProvider so useLingui() hook works
  const wrappedElement = <I18nProvider i18n={i18n}>{element}</I18nProvider>;

  return ReactEmail.render(wrappedElement, otherOptions);
};
