import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { path: '/admin/alumnos', label: '👥', title: 'Alumnos' },
    { path: '/admin/rutinas', label: '📋', title: 'Rutinas' },
    { path: '/admin/ejercicios', label: '💪', title: 'Ejercicios' },
];

const AdminSidebarMobile = () => {
    const location = useLocation();

    return (
        <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-white/70 dark:bg-black/40 backdrop-blur-lg border border-white/20 dark:border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.15)] rounded-full px-6 py-2 flex gap-6 justify-center items-center md:hidden">
            {navItems.map(({ path, label, title }) => {
                const isActive = location.pathname === path;
                return (
                    <Link
                        key={path}
                        to={path}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-full transition-all duration-300 text-xs font-medium ${isActive
                                ? 'bg-blue-500 text-white shadow-inner'
                                : 'text-gray-600 dark:text-gray-300 hover:text-blue-500'
                            }`}
                    >
                        <span className="text-xl">{label}</span>
                        <span className="mt-1">{title}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default AdminSidebarMobile;
