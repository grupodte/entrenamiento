import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // asegurate de tener esto
import AdminBottomNav from '../components/AdminBottomNav';
import RutinasManager from '../components/RutinasManager';
import EjerciciosManager from '../components/EjerciciosManager';
import AlumnosManager from '../components/AlumnosManager';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('alumnos');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login'); // redirige al login tras cerrar sesión
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <aside className="hidden md:block md:w-64 bg-white shadow-md border-r p-4 sticky top-0 h-screen flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6">Panel de Entrenador</h2>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('alumnos')}
              className={`text-left px-4 py-2 rounded ${activeTab === 'alumnos' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              👥 Alumnos
            </button>
            <button
              onClick={() => setActiveTab('rutinas')}
              className={`text-left px-4 py-2 rounded ${activeTab === 'rutinas' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              📋 Rutinas
            </button>
            <button
              onClick={() => setActiveTab('ejercicios')}
              className={`text-left px-4 py-2 rounded ${activeTab === 'ejercicios' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              💪 Ejercicios
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 text-left px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        >
          🔓 Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        {activeTab === 'alumnos' && <AlumnosManager />}
        {activeTab === 'rutinas' && <RutinasManager />}
        {activeTab === 'ejercicios' && <EjerciciosManager />}
      </main>

      <AdminBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default AdminPanel;
