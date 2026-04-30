import Navbar from '../components/layout/Navbar';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />
      <main className="pt-24 px-6 pb-16">
        <OnboardingWizard />
      </main>
    </div>
  );
}
