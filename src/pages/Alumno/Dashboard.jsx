import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaDumbbell, FaUtensils, FaEnvelope, FaUserCircle } from 'react-icons/fa';
import UserMenu from '../../components/UserMenu'; // Importa el componente UserMenu

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [nombre, setNombre] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchPerfil = async () => {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('perfiles')
                .select('nombre')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error al obtener perfil:', error.message);
            } else {
                setNombre(data?.nombre || 'Usuario');
            }
        };

        fetchPerfil();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const menuOptions = [
        {
            title: "Mis Rutinas",
            description: "Consulta tu plan de entrenamiento semanal.",
            icon: <FaDumbbell className="text-3xl text-white" />,
            path: "/dashboard/rutinas",
            color: "from-blue-500 to-indigo-600",
        },
        {
            title: "Mi Dieta",
            description: "Accede a tu plan de nutrición y comidas.",
            icon: <FaUtensils className="text-3xl text-white" />,
            path: "/dashboard/dieta",
            color: "from-green-500 to-teal-600",
        },
        {
            title: "Mensajes",
            description: "Comunícate con tu entrenador.",
            icon: <FaEnvelope className="text-3xl text-white" />,
            path: "/dashboard/mensajes",
            color: "from-orange-500 to-red-600",
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white font-inter">
            {/* Header */}
            <header className="w-full bg-gray-900 shadow-md sticky top-0 z-50">
                <div className="max-w-screen-xl mx-auto flex justify-between items-center px-4 py-3 sm:px-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            Panel Principal
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400">
                            Bienvenido, {nombre}
                        </p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={toggleMenu}
                            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                        >
                            <FaUserCircle className="text-2xl sm:text-3xl text-white" />
                        </button>
                        {isMenuOpen && (
                            <UserMenu
                                onLogout={handleLogout}
                                onEditProfile={() => {
                                    navigate('/alumno/perfil');
                                    setIsMenuOpen(false);
                                }}
                                onClose={() => setIsMenuOpen(false)}
                            />
                        )}
                    </div>
                </div>
            </header>

            {/* Tarjetas */}
            <main className="flex-grow max-w-screen-xl mx-auto p-4 sm:p-6 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {menuOptions.map((option) => (
                        <button
                            key={option.title}
                            onClick={() => navigate(option.path)}
                            className={`relative w-full p-5 rounded-xl text-white overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 active:scale-95 bg-gradient-to-br ${option.color} shadow-md`}
                        >
                            <div className="relative z-10 flex flex-col items-start h-full">
                                <div className="mb-3 p-2.5 bg-white/25 rounded-lg">
                                    {option.icon}
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold">{option.title}</h3>
                                <p className="text-xs sm:text-sm text-white/80 mt-1 mb-3">{option.description}</p>
                                <span className="mt-auto text-xs sm:text-sm font-medium group-hover:underline">
                                    Acceder →
                                </span>
                            </div>
                            <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/10 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                                <div className="text-8xl sm:text-9xl">{option.icon}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </main>

            {/* Footer (opcional, para dar sensación de app móvil) */}
            <footer className="w-full bg-gray-900 py-3 text-center text-xs text-gray-500 shadow-md">
                © {new Date().getFullYear()} DTE App. Todos los derechos reservados.
            </footer>
        </div>
    );
};

export default Dashboard;
