import RutinaForm from '../../components/Rutina/RutinaForm';
import AdminLayout from '../../layouts/AdminLayout';
import React from 'react';

const CrearRutina = () => {
    return (
        <AdminLayout>
            <div className="h-full w-full px-4 md:px-10 text-white overflow-hidden">
                <div className="max-w-5xl mx-auto space-y-6 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">🧱 Crear nueva rutina</h1>
                    </div>
                    <RutinaForm />
                </div>
            </div>
        </AdminLayout>
    );
};

export default CrearRutina;
