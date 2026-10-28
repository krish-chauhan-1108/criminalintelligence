import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthUser } from './trana-types';

export const SESSION_EXPIRED_EVENT = 'trana:session-expired';
export const API_ONLINE_EVENT = 'trana:api-online';

export const notifyApiOnline = (sourceRegistryReady = false): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(API_ONLINE_EVENT, {
        detail: { sourceRegistryReady },
      }),
    );
  }
};

export interface AuthContextValue {
  credential: string | null;
  user: AuthUser | null;
  sessionExpiresAt: string | null;
  signIn?: (credential: string) => Promise<void>;
  signOut: () => void;
  loading?: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const authHeaders = (credential: string | null): Record<string, string> => (
  credential ? { Authorization: `Bearer ${credential}` } : {}
);

/**
 * Make an authenticated request and notify listeners when the backend
 * returns 401.
 */
export const authFetch = async (
  input: RequestInfo | URL,
  credential: string | null,
  init: RequestInit = {},
): Promise<Response> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...authHeaders(credential),
      ...init.headers,
    },
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (response.ok) notifyApiOnline();

  return response;
};

/**
 * Adapter hook bridging Supabase authentication to the Python FastAPI backend.
 * Provides the Supabase session JWT access token as `credential`.
 */
export const useTranaCredential = (): AuthContextValue => {
  const [credential, setCredential] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setCredential(session.access_token);
        setUser({
          id: session.user.id,
          google_id: (session.user.user_metadata?.sub as string) || session.user.id,
          email: session.user.email || '',
          name:
            (session.user.user_metadata?.full_name as string) ||
            (session.user.user_metadata?.name as string) ||
            session.user.email,
          picture:
            (session.user.user_metadata?.avatar_url as string) ||
            (session.user.user_metadata?.picture as string),
        });
      } else if (typeof window !== "undefined") {
        const devUserStr = localStorage.getItem("trana_dev_user");
        if (devUserStr) {
          try {
            const devUser = JSON.parse(devUserStr);
            setCredential("dev-token");
            setUser({
              id: devUser.id,
              google_id: devUser.id,
              email: devUser.email || "founder@trana.in",
              name: devUser.user_metadata?.full_name || "Founder",
              picture: undefined,
            });
          } catch {
            // ignore
          }
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        setCredential(session.access_token);
        setUser({
          id: session.user.id,
          google_id: (session.user.user_metadata?.sub as string) || session.user.id,
          email: session.user.email || '',
          name:
            (session.user.user_metadata?.full_name as string) ||
            (session.user.user_metadata?.name as string) ||
            session.user.email,
          picture:
            (session.user.user_metadata?.avatar_url as string) ||
            (session.user.user_metadata?.picture as string),
        });
      } else {
        const devUserStr = typeof window !== "undefined" ? localStorage.getItem("trana_dev_user") : null;
        if (devUserStr) {
          try {
            const devUser = JSON.parse(devUserStr);
            setCredential("dev-token");
            setUser({
              id: devUser.id,
              google_id: devUser.id,
              email: devUser.email || "founder@trana.in",
              name: devUser.user_metadata?.full_name || "Founder",
              picture: undefined,
            });
          } catch {
            setCredential(null);
            setUser(null);
          }
        } else {
          setCredential(null);
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    credential,
    user,
    sessionExpiresAt: null,
    signOut: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("trana_dev_user");
      }
      supabase.auth.signOut();
    },
    loading,
  };
};

export const useAuth = useTranaCredential;
