import { Link, useLocation } from 'react-router-dom';
import { FaUsers, FaClipboardList, FaDumbbell } from 'react-icons/fa';

const navItems = [
  { path: '/admin/alumnos', title: 'Alumnos', icon: <FaUsers /> },
  { path: '/admin/rutinas', title: 'Rutinas', icon: <FaClipboardList /> },
  { path: '/admin/ejercicios', title: 'Ejercicios', icon: <FaDumbbell /> },
];

const AdminSidebarMobile = () => {
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white/80 dark:bg-black/60 backdrop-blur-lg
        border-t border-white/20 dark:border-white/10
        shadow-[0_-2px_10px_rgba(0,0,0,0.15)]
        px-2
        pt-1
        pb-[calc(0.75rem+env(safe-area-inset-bottom))]
        flex justify-around items-center
        h-[70px]
        md:hidden
      "
      role="navigation"
      aria-label="Menú inferior de administración"
    >
      {navItems.map(({ path, title, icon }) => {
        const isActive = location.pathname.startsWith(path);
        return (
          <Link
            key={path}
            to={path}
            aria-label={title}
            className={`
              flex flex-col items-center justify-center
              px-2 py-1
              rounded-full
              transition-all duration-200 text-xs font-medium
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 active:text-blue-600 active:bg-blue-100/50 dark:active:bg-blue-500/20 active:scale-95'
              }
            `}
            style={{ minWidth: 60 }}
          >
            <span className="text-xl mb-1">{icon}</span>
            <span className="text-[11px]">{title}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default AdminSidebarMobile;