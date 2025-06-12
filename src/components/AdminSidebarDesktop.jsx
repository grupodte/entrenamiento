import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { path: '/admin/alumnos', label: '👥 Alumnos' },
    { path: '/admin/rutinas', label: '📋 Rutinas' },
    { path: '/admin/ejercicios', label: '💪 Ejercicios' },
];

const AdminSidebarDesktop = () => {
    const location = useLocation();

    return (
        <aside className="hidden md:flex md:w-64 flex-col gap-4 h-screen sticky top-0 backdrop-blur-lg bg-white/70 dark:bg-black/40 border-r border-white/10 p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">FitApp Panel</h2>
            <nav className="flex flex-col gap-2">
                {navItems.map(({ path, label }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${location.pathname === path
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-white/10'
                            }`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default AdminSidebarDesktop;
