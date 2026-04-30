import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

interface RowDef {
  feature: string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const ROWS: RowDef[] = [
  { feature: 'Members',       starter: '5',   pro: '25',  enterprise: 'Unlimited' },
  { feature: 'Projects',      starter: '3',   pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Storage',       starter: '5 GB', pro: '50 GB', enterprise: '500 GB' },
  { feature: 'Audit logs',    starter: false,  pro: true,   enterprise: true },
  { feature: 'Custom domain', starter: false,  pro: false,  enterprise: true },
  { feature: 'SSO / SAML',    starter: false,  pro: false,  enterprise: true },
  { feature: 'Priority support', starter: false, pro: true, enterprise: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-white text-sm">{value}</span>;
  }
  if (value) {
    return <CheckCircleOutlinedIcon sx={{ fontSize: 18 }} className="text-violet-400" />;
  }
  return <span className="text-[#333]">—</span>;
}

export default function ComparisonTable() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-center text-[#555] uppercase tracking-widest mb-3">
          Compare plans
        </p>
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Pick the plan that fits
        </h2>

        <div className="border border-[#1f1f1f] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 bg-[#111] border-b border-[#1f1f1f]">
            <div className="px-5 py-4 text-sm font-medium text-[#888]">Feature</div>
            <div className="px-5 py-4 text-sm font-medium text-white text-center">Starter</div>
            <div className="px-5 py-4 text-sm font-medium text-violet-400 text-center">Pro</div>
            <div className="px-5 py-4 text-sm font-medium text-white text-center">Enterprise</div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-4 ${i < ROWS.length - 1 ? 'border-b border-[#1f1f1f]' : ''}`}
            >
              <div className="px-5 py-3.5 text-sm text-[#888]">{row.feature}</div>
              <div className="px-5 py-3.5 flex items-center justify-center">
                <Cell value={row.starter} />
              </div>
              <div className="px-5 py-3.5 flex items-center justify-center">
                <Cell value={row.pro} />
              </div>
              <div className="px-5 py-3.5 flex items-center justify-center">
                <Cell value={row.enterprise} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
