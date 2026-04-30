import { useNavigate } from 'react-router-dom';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { motion } from 'framer-motion';

export default function Step4Success() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className="w-20 h-20 rounded-full bg-violet-600/10 flex items-center justify-center">
          <TaskAltOutlinedIcon className="text-violet-400" sx={{ fontSize: 42 }} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
        <p className="text-sm text-[#888] max-w-sm">
          Your organization and first project are ready. Start building with your team.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
        >
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
