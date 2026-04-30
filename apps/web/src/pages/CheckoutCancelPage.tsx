import { useNavigate } from 'react-router-dom';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import Navbar from '../components/layout/Navbar';

export default function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />
      <main className="pt-32 px-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
          <ErrorOutlineOutlinedIcon className="text-[#888]" sx={{ fontSize: 42 }} />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Payment cancelled</h1>
        <p className="text-sm text-[#888] max-w-md mb-8">
          No worries — you were not charged. You can try again whenever you're ready.
        </p>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/#pricing')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
          >
            View Plans
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-[#1a1a1a] hover:bg-[#222] text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-[#1f1f1f]"
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}
