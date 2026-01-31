import type { I18n } from "@lingui/core";
import * as ReactEmail from "@react-email/render";
import React from "react";

import config from "@signtusk/tailwind-config";

import { Tailwind } from "./components";
import { BrandingProvider, type BrandingSettings } from "./providers/branding";
import { clearEmailI18n, setEmailI18n } from "./providers/i18n-ssr";

export type RenderOptions = ReactEmail.Options & {
  branding?: BrandingSettings;
  i18n?: I18n;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const colors = (config.theme?.extend?.colors || {}) as Record<string, string>;

export const render = async (
  element: React.ReactNode,
  options?: RenderOptions
) => {
  const { branding, ...otherOptions } = options ?? {};

  return ReactEmail.render(
    <BrandingProvider branding={branding}>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors,
            },
          },
        }}
      >
        {element}
      </Tailwind>
    </BrandingProvider>,
    otherOptions
  );
};

/**
 * Render email with i18n support.
 *
 * Sets a global i18n instance that email templates can access via useLinguiSSR().
 * This avoids the "Cannot read properties of null (reading 'useState')" error
 * that occurs when using I18nProvider from @lingui/react with @react-email/render.
 */
export const renderWithI18N = async (
  element: React.ReactNode,
  options?: RenderOptions
) => {
  const { branding, i18n, ...otherOptions } = options ?? {};

  if (!i18n) {
    throw new Error("i18n is required");
  }

  try {
    // Set global i18n instance for email templates to access
    setEmailI18n(i18n);

    const wrappedElement = (
      <BrandingProvider branding={branding}>
        <Tailwind
          config={{
            theme: {
              extend: {
                colors,
              },
            },
          }}
        >
          {element}
        </Tailwind>
      </BrandingProvider>
    );

    return await ReactEmail.render(wrappedElement, otherOptions);
  } finally {
    // Always clear the global i18n instance to prevent memory leaks
    clearEmailI18n();
  }
};
