import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';

const FEATURES = [
  {
    icon: <StorageOutlinedIcon className="text-violet-400" />,
    title: 'True Multi-tenancy',
    desc:  'Every organization gets its own isolated schema. No data bleed, no shared rows — enterprise-grade isolation built in.',
    // Conversion purpose: addresses #1 enterprise buyer concern (data isolation)
  },
  {
    icon: <SecurityOutlinedIcon className="text-violet-400" />,
    title: 'Clerk Auth built-in',
    desc:  'SSO, org management, JWT sessions, webhook sync — all handled by Clerk. You write zero auth code.',
    // Conversion purpose: removes biggest "will it be secure?" objection
  },
  {
    icon: <BoltOutlinedIcon className="text-violet-400" />,
    title: 'Audit every mutation',
    desc:  'Every write is automatically logged — actor, tenant, action, metadata, IP. Compliance-ready on day one.',
    // Conversion purpose: sells to compliance-sensitive buyers (fintech, health, legal)
  },
] as const;

export default function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs text-center text-[#555] uppercase tracking-widest mb-3">
          What you get
        </p>
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Everything a modern SaaS needs
        </h2>
        <p className="text-[#888] text-center max-w-xl mx-auto mb-14 text-sm">
          Stop rebuilding the same infrastructure. TenantOps handles the hard parts
          so your team ships product.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border border-[#1f1f1f] bg-[#111] rounded-xl p-6 hover:border-violet-500/30 transition-colors"
            >
              <div className="w-10 h-10 bg-violet-600/10 rounded-lg flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
