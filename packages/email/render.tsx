import type { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import * as ReactEmail from "@react-email/render";
import React from "react";

import config from "@signtusk/tailwind-config";

import { Tailwind } from "./components";
import { BrandingProvider, type BrandingSettings } from "./providers/branding";

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

export const renderWithI18N = async (
  element: React.ReactNode,
  options?: RenderOptions
) => {
  const { branding, i18n, ...otherOptions } = options ?? {};

  if (!i18n) {
    throw new Error("i18n is required");
  }

  // Use React.createElement to ensure proper React context initialization
  // This fixes the "Cannot read properties of null (reading 'useRef')" error
  const wrappedElement = React.createElement(
    I18nProvider,
    { i18n },
    React.createElement(
      BrandingProvider,
      { branding },
      React.createElement(
        Tailwind,
        {
          config: {
            theme: {
              extend: {
                colors,
              },
            },
          },
        },
        element
      )
    )
  );

  return ReactEmail.render(wrappedElement, otherOptions);
};
