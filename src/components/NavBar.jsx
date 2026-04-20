import { NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/',         label: 'Summary'  },
  { to: '/genres',   label: 'Genres'   },
  { to: '/studios',  label: 'Studios'  },
  { to: '/discover', label: 'Discover' },
];

export default function NavBar() {
  return (
    <nav
      className="w-full"
      style={{ background: 'var(--bg-base)', borderBottom: '0.5px solid var(--border)' }}
    >
      <div
        className="max-w-[1600px] mx-auto px-4 flex items-center gap-4 overflow-x-auto"
        style={{ height: '40px' }}
      >
        <NavLink
          to="/"
          className="font-semibold text-sm tracking-wide flex-shrink-0"
          style={{ color: 'var(--accent-violet)', textDecoration: 'none' }}
        >
          AnimePulse
        </NavLink>

        <div className="flex items-center gap-4 flex-shrink-0">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                fontSize: '12px',
                textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid var(--accent-violet)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'color 0.15s, border-color 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
