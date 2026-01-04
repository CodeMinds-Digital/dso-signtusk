/**
 * Simple email rendering without I18nProvider to avoid React version conflicts.
 *
 * The issue: @react-email/render bundles its own React version, which conflicts
 * with @lingui/react's hooks (useRef, etc.) when used in serverless environments.
 *
 * Solution: Pass pre-translated strings as props instead of using useLingui() hooks.
 */
import * as ReactEmail from "@react-email/render";

import config from "@signtusk/tailwind-config";

import { Tailwind } from "./components";
import { BrandingProvider, type BrandingSettings } from "./providers/branding";

export type SimpleRenderOptions = ReactEmail.Options & {
  branding?: BrandingSettings;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const colors = (config.theme?.extend?.colors || {}) as Record<string, string>;

/**
 * Render email without I18nProvider - use this for serverless environments
 * where React version conflicts occur.
 */
export const renderSimple = async (
  element: React.ReactNode,
  options?: SimpleRenderOptions
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
