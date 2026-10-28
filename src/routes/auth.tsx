import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type Search = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const r = s["redirect"];
    return { redirect: typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : undefined };
  },
  head: () => ({
    meta: [
      { title: "Sign in TRANA" },
      { name: "description", content: "Sign in or create your TRANA account to understand your legal situation and reach a lawyer." },
      { property: "og:title", content: "Sign in TRANA" },
      { property: "og:description", content: "Access your TRANA legal first-aid dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const dest = redirect ?? "/dashboard";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: dest, replace: true });
    });
    if (typeof window !== "undefined" && localStorage.getItem("trana_dev_user")) {
      navigate({ to: dest, replace: true });
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: dest, replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [dest, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
      });
      if (error) setErr(error.message);
      else if (!data.session) setMsg("Check your email to confirm your account, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
    }
    setBusy(false);
  }

  async function google() {
    setErr(null);
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (!isLocal) {
      try {
        const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
        if (r.error) setErr(r.error.message ?? "Google sign-in failed.");
        return;
      } catch {
        // Fall back to direct supabase
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth" },
      });
      if (error) {
        setErr(`Google OAuth: ${error.message}. In local development, you can use the Quick Dev Sign In button below.`);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setErr("Google sign-in failed. Please use email or dev login.");
    }
  }

  function devLogin() {
    const devUser = {
      id: "founder-dev-id",
      email: "founder@trana.in",
      user_metadata: { full_name: "Founder", name: "Founder" },
      role: "authenticated",
    };
    localStorage.setItem("trana_dev_user", JSON.stringify(devUser));
    navigate({ to: dest, replace: true });
  }

  const input = "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="font-display text-3xl font-semibold tracking-[0.25em] text-foreground">TRANA</Link>
        <h1 className="mt-10 font-display text-4xl text-foreground">
          {mode === "in"
            ? (dest?.includes("lawyer") ? "Welcome back Counsel" : "Welcome back")
            : (dest?.includes("lawyer") ? "Create your lawyer account" : "Create your account")}
        </h1>
        <button onClick={google} className="btn-line mt-8 w-full">Continue with Google</button>
        {(import.meta.env.DEV || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))) && (
          <button
            type="button"
            onClick={devLogin}
            className="mt-3 w-full border border-amber-500/40 bg-amber-950/20 text-amber-200/90 py-2.5 px-4 text-xs font-mono uppercase tracking-wider rounded transition-colors hover:bg-amber-900/30 text-center"
          >
            ⚡ Quick Dev Sign In (Localhost)
          </button>
        )}
        <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <p className="text-sm text-destructive">{err}</p>}
          {msg && <p className="text-sm text-foreground">{msg}</p>}
          <button disabled={busy} className="btn-solid w-full disabled:opacity-50">{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "New to TRANA? Create an account" : "Already have an account? Sign in"}
        </button>
        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">TRANA provides legal information and first aid not legal advice. Always consult a qualified lawyer.</p>
      </div>
    </div>
  );
}
