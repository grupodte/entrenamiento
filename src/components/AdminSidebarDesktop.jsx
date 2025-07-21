import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const navItems = [
    { path: '/admin/alumnos', label: '👥 Alumnos' },
    { path: '/admin/rutinas', label: '📋 Rutinas' },
    { path: '/admin/ejercicios', label: '💪 Ejercicios' },
];

const AdminSidebarDesktop = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Error durante el logout:", error);
            // Aquí se podría añadir una notificación al usuario (ej. con react-hot-toast)
        }
    };

    return (
        <aside className="hidden md:flex md:w-64 flex-col gap-4 h-screen sticky top-0 backdrop-blur-lg bg-white/70 dark:bg-black/40 border-r border-white/10 p-6 shadow-xl pt-safe pb-safe">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">FitApp Panel</h2>
            <nav className="flex flex-col gap-2">
                {navItems.map(({ path, label }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${location.pathname.startsWith(path) && path !== '/admin' || location.pathname === path
                            ? 'bg-ios-primary text-white active:bg-ios-primary/90'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-white/10 active:bg-gray-200/70 dark:active:bg-white/20'
                            }`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
            {/* Botón de cerrar sesión con mt-auto para empujarlo al final si el contenido de nav no llena el espacio */}
            <button
                onClick={handleLogout}
                className="mt-auto bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all duration-150"
            >
                Cerrar sesión
            </button>
        </aside>
    );
};

export default AdminSidebarDesktop;
