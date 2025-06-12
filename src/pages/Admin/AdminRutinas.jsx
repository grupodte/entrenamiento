import AdminLayout from '../../layouts/AdminLayout';
import RutinasManager from '../../components/RutinasManager';

const AdminRutinas = () => {
    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold mb-6">📋 Rutinas</h1>
            <RutinasManager />
        </AdminLayout>
    );
};

export default AdminRutinas;
