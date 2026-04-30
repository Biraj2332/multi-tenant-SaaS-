import { useClerk } from '@clerk/clerk-react';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const { openSignUp } = useClerk();

  return (
    <section className="relative px-6 pt-32 pb-16 overflow-hidden">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 border border-[#1f1f1f] rounded-full px-4 py-1.5 mb-8 bg-[#111]">
            <RocketLaunchOutlinedIcon sx={{ fontSize: 14 }} className="text-violet-400" />
            <span className="text-xs text-[#888]">Multi-tenant SaaS in minutes, not months</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6 tracking-tight">
            Ship your SaaS
            <br />
            <span className="text-violet-400">without the infra pain</span>
          </h1>

          <p className="text-[#888] text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Tenant isolation, Clerk auth, audit logging, and role-based access
            — all wired together. Just add your product logic.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => openSignUp({ redirectUrl: '/onboarding' })}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer border-none text-sm"
            >
              Get Started Free
              <ArrowForwardOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
            <a
              href="#features"
              className="text-sm text-[#888] hover:text-white transition-colors"
            >
              See features
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
