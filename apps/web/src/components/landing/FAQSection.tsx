import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is tenant isolation?',
    answer: 'Each organization gets its own PostgreSQL schema. Data can never bleed between tenants — every query is scoped automatically.',
  },
  {
    question: 'Do I need to write authentication code?',
    answer: 'No. Clerk handles signup, login, SSO, org management, and JWT sessions. TenantOps syncs it all via webhooks — zero auth code on your side.',
  },
  {
    question: 'How does the audit log work?',
    answer: 'Every mutation (create, update, delete) is automatically logged with the actor, tenant, action type, metadata, IP address, and user agent. Results are queryable and exportable.',
  },
  {
    question: 'Can I self-host TenantOps?',
    answer: 'Yes. TenantOps ships as Docker containers. Point them at your own PostgreSQL and Redis instances and you are ready to go.',
  },
  {
    question: 'What happens if I exceed plan limits?',
    answer: 'You will receive a notification. Your service continues uninterrupted — we never cut off access. Upgrade when you are ready.',
  },
  {
    question: 'Is there a free tier?',
    answer: 'Yes. The Starter plan is free forever and includes up to 5 members, 3 projects, and 5 GB of storage.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs text-center text-[#555] uppercase tracking-widest mb-3">
          FAQ
        </p>
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Common questions
        </h2>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.question}
                className="border border-[#1f1f1f] rounded-lg bg-[#111] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-transparent border-none cursor-pointer"
                >
                  <span className="text-sm text-white font-medium">{item.question}</span>
                  <ExpandMoreIcon
                    sx={{ fontSize: 20 }}
                    className={`text-[#888] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[#888] leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
