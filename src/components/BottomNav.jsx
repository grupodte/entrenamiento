// src/components/BottomNav.jsx
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaDumbbell } from 'react-icons/fa';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { to: '/dashboard', label: 'Inicio', icon: <FaHome /> },
        { to: '/dashboard/rutinas', label: 'Rutinas', icon: <FaDumbbell /> },
        { to: '/dashboard/perfil', label: 'Perfil', icon: <FaUser /> }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-50 flex justify-around items-center h-16 md:hidden">
            {navItems.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    className={`flex flex-col items-center text-sm ${location.pathname === item.to
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-500'
                        }`}
                >
                    {item.icon}
                    <span className="text-xs mt-1">{item.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export default BottomNav;
