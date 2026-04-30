const COLUMNS = [
  {
    title: 'Todo',
    color: '#555',
    cards: ['Set up CI/CD pipeline', 'Design onboarding flow'],
  },
  {
    title: 'In Progress',
    color: '#7c3aed',
    cards: ['Build tenant isolation', 'Integrate Clerk webhooks'],
  },
  {
    title: 'Done',
    color: '#22c55e',
    cards: ['Schema migration tool', 'Audit log viewer'],
  },
] as const;

export default function DashboardPreview() {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Browser frame */}
        <div className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0a0a0a]">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1f1f1f] bg-[#111]">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-xs text-[#555]">app.tenantops.dev/dashboard</span>
          </div>

          {/* Kanban board */}
          <div className="grid grid-cols-3 gap-4 p-5">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-medium text-[#888]">{col.title}</span>
                  <span className="text-xs text-[#555] ml-auto">{col.cards.length}</span>
                </div>
                <div className="space-y-2">
                  {col.cards.map((card) => (
                    <div
                      key={card}
                      className="border border-[#1f1f1f] rounded-lg bg-[#111] p-3"
                    >
                      <p className="text-xs text-[#ccc]">{card}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
