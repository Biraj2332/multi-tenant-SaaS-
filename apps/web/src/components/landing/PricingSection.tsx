import { useClerk } from '@clerk/clerk-react';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';

interface PlanDef {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

const PLANS: PlanDef[] = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    features: ['5 members', '3 projects', '5 GB storage', 'Community support'],
    highlighted: false,
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    features: ['25 members', 'Unlimited projects', '50 GB storage', 'Audit logs', 'Priority support'],
    highlighted: true,
    cta: 'Start free trial',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Unlimited members', 'Unlimited projects', '500 GB storage', 'SSO / SAML', 'Custom domain', 'Dedicated support'],
    highlighted: false,
    cta: 'Contact sales',
  },
];

export default function PricingSection() {
  const { openSignUp } = useClerk();

  return (
    <section id="pricing" className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs text-center text-[#555] uppercase tracking-widest mb-3">
          Pricing
        </p>
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-[#888] text-center max-w-md mx-auto mb-14 text-sm">
          Start free. Upgrade when you need more.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 border ${
                plan.highlighted
                  ? 'border-violet-500/50 bg-violet-600/5'
                  : 'border-[#1f1f1f] bg-[#111]'
              }`}
            >
              <h3 className="text-white font-semibold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-sm text-[#888]">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-[#ccc]">
                    <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} className="text-violet-400 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => openSignUp({ redirectUrl: '/onboarding' })}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none ${
                  plan.highlighted
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#1f1f1f]'
                }`}
              >
                {plan.cta}
                <ArrowForwardOutlinedIcon sx={{ fontSize: 14 }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
