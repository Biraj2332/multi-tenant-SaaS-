import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import LandingPage from '../pages/LandingPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import BoardPage from '../pages/BoardPage';
import CheckoutSuccessPage from '../pages/CheckoutSuccessPage';
import CheckoutCancelPage from '../pages/CheckoutCancelPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<AuthGuard><OnboardingPage /></AuthGuard>} />
      <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
      <Route path="/projects" element={<AuthGuard><ProjectsPage /></AuthGuard>} />
      <Route path="/projects/:projectId/board" element={<AuthGuard><BoardPage /></AuthGuard>} />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
      <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
