import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { PRESET_COLORS } from '../../../types/onboarding.types';

interface Props {
  projectName: string;
  projectColor: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3CreateProject({
  projectName,
  projectColor,
  onNameChange,
  onColorChange,
  onNext,
  onBack,
}: Props) {
  const isValid = projectName.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-violet-600/10 flex items-center justify-center">
          <FolderOutlinedIcon className="text-violet-400" sx={{ fontSize: 22 }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Create your first project</h2>
          <p className="text-sm text-[#888]">Projects organize your team's work</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-sm text-[#888] mb-1.5">
            Project name
          </label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="My First Project"
            className="w-full bg-[#111] border border-[#1f1f1f] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-[#888] mb-2">Project color</label>
          <div className="flex gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`w-8 h-8 rounded-lg cursor-pointer border-2 transition-all ${
                  projectColor === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-white py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-[#1f1f1f]"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
