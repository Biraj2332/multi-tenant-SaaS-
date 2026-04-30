import { useUser } from '@clerk/clerk-react';
import Navbar from '../components/layout/Navbar';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />
      <main className="pt-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-sm text-[#888] mb-10">
            Your dashboard is being built. Check back soon.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {['Projects', 'Members', 'Audit Logs'].map((label) => (
              <div
                key={label}
                className="border border-[#1f1f1f] bg-[#111] rounded-xl p-6"
              >
                <p className="text-xs text-[#555] uppercase tracking-widest mb-2">{label}</p>
                <p className="text-2xl font-bold text-white">—</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
