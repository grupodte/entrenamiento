import AdminLayout from '../../layouts/AdminLayout';
import AlumnosManager from '../../components/AlumnosManager';

const AdminAlumnos = () => {
    return (
        <AdminLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-[calc(4rem+env(safe-area-inset-bottom))]">

            <AlumnosManager />
            </div>
        </AdminLayout>
    );
};

export default AdminAlumnos;
