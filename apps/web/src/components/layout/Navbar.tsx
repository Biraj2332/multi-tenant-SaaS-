import { useClerk, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';

export default function Navbar() {
  const { openSignUp } = useClerk();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1f1f1f] bg-[#0d0d0d]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-white font-bold text-lg tracking-tight cursor-pointer bg-transparent border-none"
        >
          TenantOps
        </button>

        <SignedOut>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-[#888] hover:text-white transition-colors">
              Pricing
            </a>
            <button
              type="button"
              onClick={() => openSignUp({ redirectUrl: '/onboarding' })}
              className="text-sm text-[#888] hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => openSignUp({ redirectUrl: '/onboarding' })}
              className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-lg transition-colors cursor-pointer border-none font-medium"
            >
              Get Started
            </button>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-[#888] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1"
            >
              <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
            </button>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-lg transition-colors cursor-pointer border-none font-medium"
            >
              Go to app
            </button>
          </div>
        </SignedIn>
      </div>
    </nav>
  );
}
