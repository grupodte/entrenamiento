import AdminLayout from '../../layouts/AdminLayout';
import EjerciciosManager from '../../components/EjerciciosManager';

const AdminEjercicios = () => {
    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold mb-6">💪 Ejercicios</h1>
            <EjerciciosManager />
        </AdminLayout>
    );
};

export default AdminEjercicios;
