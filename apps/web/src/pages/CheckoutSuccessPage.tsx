import { useNavigate, useSearchParams } from 'react-router-dom';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />
      <main className="pt-32 px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="w-20 h-20 rounded-full bg-green-600/10 flex items-center justify-center mb-6">
            <TaskAltOutlinedIcon className="text-green-400" sx={{ fontSize: 42 }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-white mb-3">Payment successful!</h1>
          <p className="text-sm text-[#888] max-w-md mb-2">
            Your subscription is now active. You can start using all the features of your new plan.
          </p>
          {sessionId && (
            <p className="text-xs text-[#555] mb-8">
              Session: {sessionId.slice(0, 24)}...
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4"
        >
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
          >
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-[#1a1a1a] hover:bg-[#222] text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-[#1f1f1f]"
          >
            Back to Home
          </button>
        </motion.div>
      </main>
    </div>
  );
}
