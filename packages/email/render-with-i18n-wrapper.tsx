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
 * I18nProvider uses: useRef, useContext, useCallback, useMemo, useEffect, useLayoutEffect
 */
function patchReactHooksForSSR() {
  const originalUseRef = React.useRef;
  const originalUseContext = React.useContext;
  const originalCreateContext = React.createContext;
  const originalUseCallback = React.useCallback;
  const originalUseMemo = React.useMemo;
  const originalUseEffect = React.useEffect;
  const originalUseLayoutEffect = React.useLayoutEffect;

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

  // Patch useCallback to just return the function (no memoization in SSR)
  (React as any).useCallback = function useCallback<T extends Function>(
    callback: T,
    deps?: any[]
  ): T {
    return callback;
  };

  // Patch useMemo to just call the function (no memoization in SSR)
  (React as any).useMemo = function useMemo<T>(
    factory: () => T,
    deps?: any[]
  ): T {
    return factory();
  };

  // Patch useEffect to do nothing in SSR
  (React as any).useEffect = function useEffect(
    effect: () => void | (() => void),
    deps?: any[]
  ): void {
    // No-op in SSR
  };

  // Patch useLayoutEffect to do nothing in SSR
  (React as any).useLayoutEffect = function useLayoutEffect(
    effect: () => void | (() => void),
    deps?: any[]
  ): void {
    // No-op in SSR
  };

  return {
    restore: () => {
      React.useRef = originalUseRef;
      React.useContext = originalUseContext;
      React.createContext = originalCreateContext;
      React.useCallback = originalUseCallback;
      React.useMemo = originalUseMemo;
      React.useEffect = originalUseEffect;
      React.useLayoutEffect = originalUseLayoutEffect;
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
