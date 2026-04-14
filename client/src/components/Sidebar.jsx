const sections = [
  {
    title: 'Trending',
    items: ['#CampusLife', '#StartupIndia', '#DesignSystems', '#Placements2026'],
  },
  {
    title: 'Suggestions',
    items: ['Aarav Singh', 'Riya Sharma', 'Tech Club', 'Alumni Network'],
  },
  {
    title: 'Connections',
    items: ['3 profile views today', '12 new messages this week', '2 event invites'],
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:gap-4">
      {sections.map((section) => (
        <section key={section.title} className="glass-card p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {section.title}
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {section.items.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-white/70 px-3 py-2 transition hover:bg-blue-50 dark:bg-slate-800/70 dark:hover:bg-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}
