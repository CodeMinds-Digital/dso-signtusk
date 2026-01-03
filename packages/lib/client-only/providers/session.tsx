import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useLocation } from "react-router";

import { authClient } from "@signtusk/auth/client";
import type { SessionUser } from "@signtusk/auth/types";
import { trpc } from "@signtusk/trpc/client";
import type { TGetOrganisationSessionResponse } from "@signtusk/trpc/server/organisation-router/get-organisation-session.types";

import type { Session } from "../../constants/prisma-enums";
import { SKIP_QUERY_BATCH_META } from "../../constants/trpc";

export type AppSession = {
  session: Session;
  user: SessionUser;
  organisations: TGetOrganisationSessionResponse;
};

interface SessionProviderProps {
  children: React.ReactNode;
  initialSession: AppSession | null;
}

interface SessionContextValue {
  sessionData: AppSession | null;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  if (!context.sessionData) {
    throw new Error("Session not found");
  }

  return {
    ...context.sessionData,
    refreshSession: context.refreshSession,
  };
};

export const useOptionalSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useOptionalSession must be used within a SessionProvider");
  }

  return context;
};

export const SessionProvider = ({
  children,
  initialSession,
}: SessionProviderProps) => {
  const [session, setSession] = useState<AppSession | null>(initialSession);

  const location = useLocation();

  const refreshSession = useCallback(async () => {
    try {
      const newSession = await authClient.getSession();

      if (!newSession.isAuthenticated) {
        // Only clear session if we're sure the user is logged out
        // Don't clear on network errors
        setSession(null);
        return;
      }

      const organisations =
        await trpc.organisation.internal.getOrganisationSession
          .query(undefined, SKIP_QUERY_BATCH_META.trpc)
          .catch((err) => {
            console.error(
              "[SessionProvider] Failed to fetch organisations:",
              err
            );
            return [];
          });

      setSession({
        session: newSession.session,
        user: newSession.user,
        organisations,
      });
    } catch (err) {
      // Don't clear session on network errors - keep the existing session
      console.error("[SessionProvider] Failed to refresh session:", err);
    }
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void refreshSession();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshSession]);

  /**
   * Refresh session in background on navigation.
   */
  useEffect(() => {
    void refreshSession();
  }, [location.pathname]);

  return (
    <SessionContext.Provider
      value={{
        sessionData: session,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
