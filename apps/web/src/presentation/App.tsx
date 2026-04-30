import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import LandingPage from '../pages/LandingPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import CheckoutSuccessPage from '../pages/CheckoutSuccessPage';
import CheckoutCancelPage from '../pages/CheckoutCancelPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/onboarding"
        element={
          <>
            <SignedIn><OnboardingPage /></SignedIn>
            <SignedOut><RedirectToSignIn redirectUrl="/onboarding" /></SignedOut>
          </>
        }
      />
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn><DashboardPage /></SignedIn>
            <SignedOut><RedirectToSignIn redirectUrl="/dashboard" /></SignedOut>
          </>
        }
      />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
      <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
