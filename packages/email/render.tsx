import type { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import * as ReactEmail from "@react-email/render";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
  const { branding, i18n, plainText, ...otherOptions } = options ?? {};

  if (!i18n) {
    throw new Error("i18n is required");
  }

  // Use react-dom/server directly to avoid React version conflicts with @react-email/render
  // The @react-email/render package bundles its own React which conflicts with hooks
  const wrappedElement = (
    <I18nProvider i18n={i18n}>
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
    </I18nProvider>
  );

  try {
    // Use react-dom/server directly (avoids React version conflict with @react-email/render)
    const html = renderToStaticMarkup(wrappedElement);

    if (plainText) {
      // Simple HTML to text conversion for plain text version
      return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
    }

    // Add doctype for HTML emails
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html}`;
  } catch (error) {
    console.error(
      "[EMAIL_RENDER] Failed to render with react-dom/server:",
      error
    );
    throw error;
  }
};
