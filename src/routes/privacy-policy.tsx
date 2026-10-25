import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [{ title: "Privacy Policy" }],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="bg-[#0A0A0A] text-white flex flex-col items-center justify-center min-h-screen p-6">
      <Link to="/" className="text-white text-3xl font-bold mb-8">
        TRANA
      </Link>
      <h1 className="text-4xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Privacy Policy
      </h1>
      <p className="text-center max-w-2xl">Coming Soon</p>
    </div>
  );
}
