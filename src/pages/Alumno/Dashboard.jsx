import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaDumbbell, FaUtensils, FaEnvelope } from 'react-icons/fa';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Opciones del menú del dashboard
    const menuOptions = [
        {
            title: "Mis Rutinas",
            description: "Consulta tu plan de entrenamiento semanal.",
            icon: <FaDumbbell className="text-4xl text-white" />,
            path: "/dashboard/rutinas", // La nueva ruta para las rutinas
            color: "from-blue-500 to-indigo-600",
        },
        {
            title: "Mi Dieta",
            description: "Accede a tu plan de nutrición y comidas.",
            icon: <FaUtensils className="text-4xl text-white" />,
            path: "/dashboard/dieta", // Ruta futura para la dieta
            color: "from-green to-teal-600",
        },
        {
            title: "Mensajes",
            description: "Comunícate con tu entrenador.",
            icon: <FaEnvelope className="text-4xl text-white" />,
            path: "/dashboard/mensajes", // Ruta futura para mensajes
            color: "from-orange-500 to-red-600",
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 font-inter">
            {/* Header */}
            <header className="w-full bg-white shadow-sm">
                <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Panel Principal
                        </h1>
                        <p className="text-sm text-gray-500">
                            Bienvenido, {user?.user_metadata?.nombre || 'Alumno'}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition"
                    >
                        <FaSignOutAlt />
                        Cerrar sesión
                    </button>
                </div>
            </header>

            {/* Contenido principal con las tarjetas de menú */}
            <main className="max-w-5xl mx-auto p-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {menuOptions.map((option) => (
                        <button
                            key={option.title}
                            onClick={() => navigate(option.path)}
                            className={`relative w-full p-6 rounded-2xl text-white overflow-hidden group transition-transform duration-300 hover:scale-105 bg-gradient-to-br ${option.color}`}
                        >
                            <div className="relative z-10 flex flex-col items-start h-full">
                                <div className="mb-4 p-3 bg-white/20 rounded-full">
                                    {option.icon}
                                </div>
                                <h3 className="text-xl font-bold">{option.title}</h3>
                                <p className="text-sm text-white/80 mt-1">{option.description}</p>
                                <span className="mt-auto pt-4 text-sm font-semibold group-hover:underline">
                                    Acceder →
                                </span>
                            </div>
                            {/* Efecto de fondo */}
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 text-white/10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125">
                                {option.icon && <div className="text-9xl">{option.icon}</div>}
                            </div>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;