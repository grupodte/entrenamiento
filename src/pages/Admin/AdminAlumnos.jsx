import AdminLayout from './AdminLayout';
import AlumnosManager from '../../components/AlumnosManager';

const AdminAlumnos = () => {
    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold mb-6">👥 Alumnos</h1>
            <AlumnosManager />
        </AdminLayout>
    );
};

export default AdminAlumnos;
