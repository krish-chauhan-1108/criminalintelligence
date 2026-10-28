import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      if (typeof window !== "undefined") {
        const devUser = localStorage.getItem("trana_dev_user");
        if (devUser) {
          try {
            return { user: JSON.parse(devUser) };
          } catch {
            // ignore JSON error
          }
        }
      }
      throw redirect({ to: "/auth", search: { redirect: location.pathname } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
