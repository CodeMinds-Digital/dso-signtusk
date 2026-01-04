/**
 * Simple email rendering without I18nProvider or Tailwind to avoid React version
 * conflicts and Suspense issues in serverless environments.
 *
 * Issues solved:
 * 1. @react-email/render bundles its own React version, which conflicts with @lingui/react hooks
 * 2. @react-email/tailwind uses Suspense which causes "component suspended" errors
 *
 * Solution: Use inline styles and pass pre-translated strings as props.
 */
import * as ReactEmail from "@react-email/render";

export type SimpleRenderOptions = ReactEmail.Options;

/**
 * Render email without I18nProvider or Tailwind - use this for serverless environments
 * where React version conflicts or Suspense issues occur.
 *
 * Templates using this renderer should use inline styles instead of Tailwind classes.
 */
export const renderSimple = async (
  element: React.ReactNode,
  options?: SimpleRenderOptions
) => {
  return ReactEmail.render(element, options);
};
