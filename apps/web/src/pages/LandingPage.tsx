import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DashboardPreview from '../components/landing/DashboardPreview';
import SocialProofStrip from '../components/landing/SocialProofStrip';
import FeaturesSection from '../components/landing/FeaturesSection';
import ComparisonTable from '../components/landing/ComparisonTable';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />
      <HeroSection />
      <DashboardPreview />
      <SocialProofStrip />
      <FeaturesSection />
      <ComparisonTable />
      <PricingSection />
      <FAQSection />
      <footer className="border-t border-[#1f1f1f] px-6 py-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm text-[#555]">TenantOps</span>
          <span className="text-xs text-[#333]">Built with NestJS, React, and Clerk</span>
        </div>
      </footer>
    </div>
  );
}
