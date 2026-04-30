import { useOnboarding } from '../../hooks/useOnboarding';
import Step1CreateOrg from './steps/Step1CreateOrg';
import Step2InviteMembers from './steps/Step2InviteMembers';
import Step3CreateProject from './steps/Step3CreateProject';
import Step4Success from './steps/Step4Success';

const STEP_LABELS = ['Organization', 'Team', 'Project', 'Done'] as const;

export default function OnboardingWizard() {
  const {
    state,
    setOrgName,
    setOrgSlug,
    addInvitee,
    removeInvitee,
    setProjectName,
    setProjectColor,
    nextStep,
    prevStep,
  } = useOnboarding();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-10">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3 | 4;
          const isActive = state.step === stepNum;
          const isCompleted = state.step > stepNum;
          return (
            <div key={label} className="flex-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  isCompleted
                    ? 'bg-violet-600'
                    : isActive
                      ? 'bg-violet-600/50'
                      : 'bg-[#1f1f1f]'
                }`}
              />
              <p
                className={`text-xs mt-2 ${
                  isActive || isCompleted ? 'text-white' : 'text-[#555]'
                }`}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {state.step === 1 && (
        <Step1CreateOrg
          orgName={state.orgName}
          orgSlug={state.orgSlug}
          onNameChange={setOrgName}
          onSlugChange={setOrgSlug}
          onNext={nextStep}
        />
      )}
      {state.step === 2 && (
        <Step2InviteMembers
          invitees={state.invitees}
          onAdd={addInvitee}
          onRemove={removeInvitee}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {state.step === 3 && (
        <Step3CreateProject
          projectName={state.projectName}
          projectColor={state.projectColor}
          onNameChange={setProjectName}
          onColorChange={setProjectColor}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {state.step === 4 && <Step4Success />}
    </div>
  );
}
