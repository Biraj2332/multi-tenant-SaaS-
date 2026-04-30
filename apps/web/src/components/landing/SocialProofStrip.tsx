const LOGOS = [
  'Vercel', 'Stripe', 'Linear', 'Notion', 'Figma', 'Slack',
] as const;

export default function SocialProofStrip() {
  return (
    <section className="px-6 py-14 border-y border-[#1f1f1f]">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-center text-[#555] uppercase tracking-widest mb-8">
          Trusted by teams building the next generation of SaaS
        </p>
        <div className="flex items-center justify-center gap-10 flex-wrap">
          {LOGOS.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold text-[#333] select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
