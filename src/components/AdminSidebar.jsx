// src/components/AdminSidebar.jsx
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
    const location = useLocation();

    const navItems = [
        { path: '/admin/alumnos', label: '👥 Alumnos' },
        { path: '/admin/rutinas', label: '📋 Rutinas' },
        { path: '/admin/ejercicios', label: '💪 Ejercicios' },
    ];

    return (
        <>
            {/* Sidebar para escritorio */}
            <aside className="hidden md:block md:w-64 bg-white shadow-md border-r p-4 h-screen sticky top-0">
                <h2 className="text-xl font-bold mb-6">Panel</h2>
                <nav className="flex flex-col gap-2">
                    {navItems.map(({ path, label }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`px-4 py-2 rounded ${location.pathname === path ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Barra inferior fija para móvil */}
            <nav className="fixed bottom-0 left-0 w-full bg-white border-t shadow-md flex justify-around items-center md:hidden z-50">
                {navItems.map(({ path, label }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`flex flex-col items-center py-2 px-4 text-sm ${location.pathname === path ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
        </>
    );
};

export default AdminSidebar;
