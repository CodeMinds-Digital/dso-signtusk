/**
 * Wrapper to render email templates with i18n support without React context issues.
 *
 * This patches React hooks to work during SSR with @react-email/render's bundled React.
 */
import { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import * as ReactEmail from "@react-email/render";
import React from "react";

export type RenderWithI18nWrapperOptions = ReactEmail.Options & {
  i18n: I18n;
};

/**
 * Patch React hooks to work in SSR mode.
 * @react-email/render bundles its own React without context initialization.
 */
function patchReactHooksForSSR() {
  const originalUseRef = React.useRef;
  const originalUseContext = React.useContext;
  const originalCreateContext = React.createContext;

  // Store for contexts created during rendering
  const contextStore = new Map<any, any>();

  // Patch useRef to return a simple object for SSR
  (React as any).useRef = function useRef<T>(initialValue: T): { current: T } {
    return { current: initialValue };
  };

  // Patch createContext to store contexts
  (React as any).createContext = function createContext<T>(defaultValue: T) {
    const context = originalCreateContext(defaultValue);
    contextStore.set(context, defaultValue);
    return context;
  };

  // Patch useContext to return stored values
  (React as any).useContext = function useContext<T>(
    context: React.Context<T>
  ): T {
    if (contextStore.has(context)) {
      return contextStore.get(context);
    }
    // Return the default value from the context
    return (context as any)._currentValue ?? (context as any)._defaultValue;
  };

  return {
    restore: () => {
      React.useRef = originalUseRef;
      React.useContext = originalUseContext;
      React.createContext = originalCreateContext;
      contextStore.clear();
    },
  };
}

/**
 * Render email with I18n context properly initialized.
 * This patches React hooks temporarily to work with @react-email/render's bundled React.
 */
export const renderWithI18nWrapper = async (
  element: React.ReactNode,
  options: RenderWithI18nWrapperOptions
) => {
  const { i18n, ...otherOptions } = options;

  // Patch React hooks for SSR
  const { restore } = patchReactHooksForSSR();

  try {
    // Wrap in I18nProvider so useLingui() hook works
    const wrappedElement = <I18nProvider i18n={i18n}>{element}</I18nProvider>;

    return await ReactEmail.render(wrappedElement, otherOptions);
  } finally {
    // Always restore original hooks
    restore();
  }
};
