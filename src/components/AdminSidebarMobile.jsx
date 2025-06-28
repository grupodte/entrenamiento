import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/admin/alumnos', title: 'Alumnos' },
  { path: '/admin/rutinas',  title: 'Rutinas' },
  { path: '/admin/ejercicios',  title: 'Ejercicios' },
];

const AdminSidebarMobile = () => {
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white/80 dark:bg-black/40 backdrop-blur-lg
        border-t border-white/20 dark:border-white/10
        shadow-[0_-2px_10px_rgba(0,0,0,0.15)]
        px-4
        pt-2
        pb-[calc(0.5rem+env(safe-area-inset-bottom))]
        flex justify-around items-center
        h-[50px]
        md:hidden
      "
    >
      {navItems.map(({ path, label, title }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`
              flex flex-col items-center justify-center
              px-3 py-1
              rounded-full
              transition-all duration-300 text-xs font-medium
              ${
                isActive
                  ? 'bg-blue-500 text-white shadow-inner active:bg-blue-600 active:scale-95'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 active:text-blue-600 active:bg-blue-100/50 dark:active:bg-blue-500/20 active:scale-95'
              }
            `}
          >
            <span className="text-xl">{label}</span>
            <span className="mt-0.5">{title}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default AdminSidebarMobile;
