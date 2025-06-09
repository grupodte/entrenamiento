// src/Admin/AdminLayout.jsx
import AdminSidebar from '../../components/AdminSidebar';

const AdminLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 p-6 md:p-10">{children}</main>
        </div>
    );
};

export default AdminLayout;
