// src/pages/Admin/AdminRutinas.jsx
import AdminLayout from '../../layouts/AdminLayout';
import RutinasManager from '../../components/RutinasManager';

const AdminRutinas = () => {
    return (
        <AdminLayout>
            <div className="space-y-10 px-4 md:px-8 py-10">
                <RutinasManager />
            </div>
        </AdminLayout>
    );
};

export default AdminRutinas;
