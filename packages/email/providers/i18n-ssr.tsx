/**
 * SSR-safe i18n for email templates.
 *
 * This provides a way to use i18n in email templates without React Context or hooks,
 * which don't work with @react-email/render's bundled React.
 */
import type { I18n } from "@lingui/core";

// Global i18n instance for SSR email rendering
let globalI18n: I18n | null = null;

/**
 * Set the global i18n instance for email rendering.
 * This should be called before rendering emails.
 */
export const setEmailI18n = (i18n: I18n) => {
  globalI18n = i18n;
};

/**
 * Get the global i18n instance.
 * Throws if not set.
 */
export const getEmailI18n = (): I18n => {
  if (!globalI18n) {
    throw new Error(
      "Email i18n not initialized. Call setEmailI18n() before rendering emails."
    );
  }
  return globalI18n;
};

/**
 * Hook replacement for email templates.
 * Returns the global i18n instance instead of using React Context.
 *
 * Usage in email templates (drop-in replacement for useLingui):
 * ```tsx
 * import { useLinguiSSR } from '../providers/i18n-ssr';
 *
 * export const MyEmail = (props) => {
 *   const { _ } = useLinguiSSR();
 *   // ... rest of template
 * }
 * ```
 */
export const useLinguiSSR = () => {
  const i18n = getEmailI18n();
  return {
    _: i18n._,
    i18n,
  };
};

/**
 * Clear the global i18n instance after rendering.
 * This should be called in a finally block to prevent memory leaks.
 */
export const clearEmailI18n = () => {
  globalI18n = null;
};
