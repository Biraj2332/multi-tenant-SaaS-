import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

interface Props {
  orgName: string;
  orgSlug: string;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  onNext: () => void;
}

export default function Step1CreateOrg({ orgName, orgSlug, onNameChange, onSlugChange, onNext }: Props) {
  const isValid = orgName.trim().length >= 2 && orgSlug.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-violet-600/10 flex items-center justify-center">
          <BusinessOutlinedIcon className="text-violet-400" sx={{ fontSize: 22 }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Create your organization</h2>
          <p className="text-sm text-[#888]">This is your team's workspace</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="org-name" className="block text-sm text-[#888] mb-1.5">
            Organization name
          </label>
          <input
            id="org-name"
            type="text"
            value={orgName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Acme Inc."
            className="w-full bg-[#111] border border-[#1f1f1f] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="org-slug" className="block text-sm text-[#888] mb-1.5">
            URL slug
          </label>
          <div className="flex items-center bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden focus-within:border-violet-500/50 transition-colors">
            <span className="text-sm text-[#555] pl-4 select-none">tenantops.dev/</span>
            <input
              id="org-slug"
              type="text"
              value={orgSlug}
              onChange={(e) => onSlugChange(e.target.value)}
              className="flex-1 bg-transparent py-2.5 pr-4 text-white text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!isValid}
        onClick={onNext}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
      >
        Continue
      </button>
    </div>
  );
}
