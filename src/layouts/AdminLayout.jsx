import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-black text-white">
            {/* Sidebar */}
            <aside className="hidden md:block w-64 bg-white/10 backdrop-blur-md p-4">
                <h2 className="text-xl font-bold mb-4">Menú</h2>
                {/* Aquí iría tu navegación o contenido de sidebar */}
            </aside>

            {/* Contenido principal */}
            <main className="flex-1 p-6 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
