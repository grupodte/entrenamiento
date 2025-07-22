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
        bg-white/80 dark:bg-black/70 backdrop-blur-md
        border-t border-white/20 dark:border-white/10
        shadow-[0_-2px_10px_rgba(0,0,0,0.15)]
        px-4
        pt-1
        flex justify-around items-center
        h-[75px]
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
              gap-0.5
              px-3 py-1.5
              rounded-xl
              transition-all duration-200 ease-in-out text-xs font-medium
              ${isActive
                ? 'bg-white/10 text-white shadow-md scale-[0.85] active:scale-[1]'
                : 'text-gray-700 dark:text-gray-300 hover:text-ios-primary active:text-ios-primary active:bg-ios-primary/10 dark:active:bg-ios-primary/20 active:scale-95'
              }
            `}
          >
            <span className="text-[20px]">{icon}</span>
            <span className="text-[11px] leading-none">{title}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default AdminSidebarMobile;
