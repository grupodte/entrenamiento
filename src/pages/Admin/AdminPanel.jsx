// src/pages/AdminPanel.jsx
import AdminSidebar from '../../components/AdminSidebar';

const AdminPanel = () => {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-10">
        <h1 className="text-2xl font-bold mb-6">Bienvenido al panel del entrenador</h1>
        <p className="text-gray-700">Usá el menú lateral para gestionar alumnos, rutinas o ejercicios.</p>
      </main>
    </div>
  );
};

export default AdminPanel;
