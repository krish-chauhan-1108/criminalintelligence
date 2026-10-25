import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRANA — Legal Guidance, Within Reach" },
      { name: "description", content: "TRANA makes Indian legal information easier to understand and connects you with the right lawyer." },
      { property: "og:title", content: "TRANA — Legal Guidance, Within Reach" },
      { property: "og:description", content: "Legal first aid for India. Understand your situation and reach a qualified lawyer." },
    ],
  }),
  component: Index,
});

const Disclaimer = "TRANA provides legal information and first aid — not legal advice. Always consult a qualified lawyer.";

function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`mb-6 text-xs uppercase tracking-[0.3em] ${light ? "text-ink-muted" : "text-muted-foreground"}`}>{children}</p>;
}

function H2({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <h2 className={`font-display text-4xl leading-[1.05] font-medium md:text-6xl ${light ? "text-ink" : "text-foreground"}`}>{children}</h2>;
}

function Index() {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="font-display text-2xl font-semibold tracking-[0.25em]">TRANA</a>
          <div className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#who" className="hover:text-foreground">Who we help</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <Link to="/lawyer" className="hover:text-foreground">For Lawyers</Link>
            <a href="#how" className="hover:text-foreground">How it works</a>
          </div>
          <a href="#cta" onClick={(e)=>{e.preventDefault(); setModalOpen(true);}} className="btn-solid !px-4 !py-2.5 !text-[0.7rem]">Get Legal Guidance</a>
        </div>
      </nav>

      {/* Chat Section */}

  <div className="mx-auto max-w-3xl px-6 text-center">
    <h2 className="text-white text-3xl mb-4" style={{fontFamily: "'Cormorant Garamond', serif"}}>Chat with TRANA</h2>
    <p className="text-gray-400 mb-8">Ask any question about your criminal law situation in India — in Hindi or English</p>
    <ChatBox />
  </div>
</section>
{/* Hero */}
      <section id="top" className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 py-24">
        <p className="reveal mb-8 font-display text-xl italic text-muted-foreground">त्राणा — Protection. Delivered.</p>
        <h1 className="reveal font-display text-6xl leading-[0.95] font-medium md:text-8xl lg:text-[8.5rem]">
          Legal Guidance,<br /><em className="font-normal">Within Reach.</em>
        </h1>
        <p className="reveal mt-10 max-w-xl text-lg font-light text-muted-foreground">
          TRANA makes legal information easier to understand and connects you with the right lawyer — when it matters most.
        </p>
        <div className="reveal mt-10 flex flex-wrap gap-4">
          <a href="#cta" onClick={(e)=>{e.preventDefault(); setModalOpen(true);}} className="btn-solid">Get Legal Guidance</a>
          <a href="#cta" className="btn-line">Talk to a Lawyer</a>
        </div>
        <p className="reveal mt-8 max-w-md text-xs text-muted-foreground">{Disclaimer}</p>
      </section>

      {/* Who */}
      <section id="who" className="border-t border-border bg-secondary py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal"><Eyebrow>01 — Who we help</Eyebrow><H2>Built for Everyone<br />Who Needs the Law</H2></div>
          <div className="mt-16 grid gap-px bg-border md:grid-cols-3">
            {[
              ["🧑‍💼", "Citizens", "Facing a Legal Problem?", "Understand your rights, decode legal documents, and get connected to a qualified lawyer — quickly and clearly."],
              ["⚖️", "Lawyers", "For Legal Professionals", "Research cases, find citations from High Courts and lower courts, draft documents, and connect with other lawyers in our professional network."],
              ["📚", "Students", "For Law Students", "Access legal research with case citations, judgment timelines, and practical legal tools to support your studies."],
            ].map(([i, k, t, b]) => (
              <div key={t} className="reveal bg-secondary p-10">
                <div className="text-3xl grayscale">{i}</div>
                <p className="mt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground">{k}</p>
                <h3 className="mt-3 font-display text-3xl">{t}</h3>
                <p className="mt-4 font-light leading-relaxed text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-paper py-28 text-ink">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal"><Eyebrow light>02 — What you can do</Eyebrow><H2 light>Your Legal First Aid —<br />All in One Place</H2></div>
          <div className="mt-16 grid gap-px bg-paper-border md:grid-cols-2">
            {[
              ["Understand Legal Documents", "Upload or describe any legal situation and get a plain-language explanation of what it means and what to do next."],
              ["Find the Right Lawyer", "TRANA connects you to verified legal professionals. Arrange a consultation by call or chat — directly through the platform."],
              ["Legal Research & Citations", "Find relevant case law with citations, timelines, and judgments from the Supreme Court, High Courts, and lower courts."],
              ["Connect With Experts", "Beyond lawyers, connect with legal professionals and experts across different areas of law."],
            ].map(([t, b], n) => (
              <div key={t} className="reveal bg-paper p-10 md:p-14">
                <span className="font-display text-5xl text-ink-muted">0{n + 1}</span>
                <h3 className="mt-6 font-display text-3xl font-medium">{t}</h3>
                <p className="mt-4 max-w-md font-light leading-relaxed text-ink-muted">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI tools */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal max-w-2xl"><Eyebrow>03 — AI tools</Eyebrow><H2>AI-Assisted Legal Tools</H2>
            <p className="mt-6 text-lg font-light text-muted-foreground">Powerful features being built to make legal help faster and smarter.</p></div>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {[
              ["In Development", "FIR Analyser", "Describe or upload an FIR. Our AI will identify the sections invoked, explain what they mean, check bail eligibility, and suggest next steps — in plain language."],
              ["Planned", "Legal Information Assistant", "A chat assistant that answers your legal questions using verified Indian law — and always guides you toward a qualified lawyer when needed."],
            ].map(([badge, t, b]) => (
              <div key={t} className="reveal border border-border bg-card p-10">
                <span className="inline-block border border-primary px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em]">{badge}</span>
                <h3 className="mt-8 font-display text-4xl">{t}</h3>
                <p className="mt-4 font-light leading-relaxed text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
          <p className="reveal mt-10 font-display text-xl italic text-muted-foreground">
            These are AI tools for information only. For legal advice, TRANA will always connect you to a real lawyer.
          </p>
        </div>
      </section>

      {/* Lawyers */}
      <section id="lawyers" className="bg-paper py-28 text-ink">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2">
          <div className="reveal">
            <Eyebrow light>04 — For lawyers</Eyebrow>
            <H2 light>A Platform Built for Legal Professionals Too</H2>
            <p className="mt-8 text-lg font-light leading-relaxed text-ink-muted">
              TRANA isn't just for people seeking help. It's a platform where lawyers and legal professionals can connect with clients, collaborate with peers, and access tools that make their practice more efficient.
            </p>
          </div>
          <div className="reveal flex flex-col justify-end">
            {["Receive client referrals directly through the platform", "Access legal research with case citations and timelines", "Connect with other lawyers in our professional network"].map((x) => (
              <div key={x} className="flex gap-5 border-t border-paper-border py-6">
                <span className="font-display text-2xl">✓</span>
                <p className="text-lg">{x}</p>
              </div>
            ))}
            <Link to="/lawyer" className="btn-ink mt-8 self-start">Access Lawyer Workspace</Link>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal"><Eyebrow>05 — Process</Eyebrow><H2>How TRANA Works</H2></div>
          <div className="mt-16 grid gap-10 md:grid-cols-4">
            {[
              ["Describe Your Situation", "Tell us what's happened in plain language — no legal knowledge needed."],
              ["Get Instant Clarity", "TRANA explains your legal situation, your rights, and what your options are."],
              ["Connect With a Lawyer", "We connect you to a verified lawyer for a consultation by call or chat."],
              ["You're Guided, Not Alone", "TRANA stays with you — answering questions and helping you understand every step."],
            ].map(([t, b], n) => (
              <div key={t} className="reveal border-t border-primary pt-6">
                <span className="text-xs tracking-[0.25em] text-muted-foreground">STEP 0{n + 1}</span>
                <h3 className="mt-4 font-display text-2xl">{t}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="bg-primary py-32 text-primary-foreground">
        <p className="reveal mx-auto max-w-5xl px-6 text-center font-display text-4xl leading-tight md:text-6xl">
          TRANA is your legal guide — <em>not your lawyer.</em><br />We exist to make sure you always reach one.
        </p>
      </section>

      {/* CTA */}
      <section id="cta" className="border-b border-border py-32 text-center">
        <div className="reveal mx-auto max-w-3xl px-6">
          <h2 className="font-display text-6xl font-medium md:text-8xl">Don't face it alone.</h2>
          <p className="mt-6 text-lg font-light text-muted-foreground">Get legal guidance or connect with a lawyer today.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="#cta" onClick={(e)=>{e.preventDefault(); setModalOpen(true);}} className="btn-solid">Get Legal Guidance</a>
            <a href="#cta" onClick={(e)=>{e.preventDefault(); setModalOpen(true);}} className="btn-line">Talk to a Lawyer</a>
          </div>
        </div>
{/* Modal */}
{modalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
    <div className="bg-[#0A0A0A] p-8 rounded-lg relative w-96">
      <button onClick={() => setModalOpen(false)} className="absolute top-2 right-2 text-white text-xl font-bold">✕</button>
      <h2 className="text-white text-xl mb-4">We're Launching Soon</h2>
      <p className="text-gray-400 mb-4">TRANA is almost ready. Leave your email and we will notify you the moment we go live.</p>
      <input type="email" placeholder="Your email" className="w-full p-2 mb-4 bg-white text-black border border-black" />
      <button className="w-full bg-white text-black py-2">Notify Me</button>
    </div>
  </div>
)}
      </section>

      <footer className="bg-secondary py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <p className="font-display text-3xl font-semibold tracking-[0.25em]">TRANA</p>
              <p className="mt-2 font-display italic text-muted-foreground">त्राणा — Protection. Delivered.</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {["About", "For Lawyers", "Legal Research", "Privacy Policy", "Contact"].map((l) => {
                if (l === "For Lawyers") {
                  return <Link key={l} to="/lawyer" className="hover:text-foreground">{l}</Link>;
                } else if (l === "About") {
                  return <Link key={l} to="/about" className="hover:text-foreground">{l}</Link>;
                } else if (l === "Privacy Policy") {
                  return <Link key={l} to="/privacy-policy" className="hover:text-foreground">{l}</Link>;
                } else if (l === "Contact") {
                  return <Link key={l} to="/contact" className="hover:text-foreground">{l}</Link>;
                } else {
                  return <a key={l} href="#top" className="hover:text-foreground">{l}</a>;
                }
              })}
            </div>
          </div>
          <p className="mt-12 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            TRANA provides legal information and first aid only. Nothing on this platform constitutes legal advice. Always consult a qualified legal professional.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">© 2026 TRANA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
