
import RutinaForm from '../../components/Rutina/RutinaForm';
import AdminLayout from '../../layouts/AdminLayout';
// src/pages/Admin/CrearRutina.jsx
import React from 'react';

const CrearRutina = () => {
    return (
        <AdminLayout> 
        <div className="min-h-screen px-4 py-8 md:px-10 text-white">
            <div className="max-w-5xl mx-auto space-y-6">
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
