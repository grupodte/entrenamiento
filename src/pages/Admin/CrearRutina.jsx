import React from 'react';
import { useNavigate } from 'react-router-dom';
import RutinaForm from '../../components/Rutina/RutinaForm';
import AdminLayout from '../../layouts/AdminLayout';
import { toast } from 'react-hot-toast';

const CrearRutina = () => {
    const navigate = useNavigate();

    const handleGuardarCrear = (rutinaGuardada) => {
        // La notificación de éxito ya la maneja RutinaForm
        // toast.success(`Rutina "${rutinaGuardada.nombre}" creada con éxito.`);
        navigate('/admin/rutinas'); // Redirigir a la lista de rutinas o a la rutina recién creada
    };

    return (
        <AdminLayout>
            <div className="w-full min-h-screen flex flex-col bg-neutral-900 text-white">
                <div className="p-4 md:p-6">
                    <h1 className="text-2xl font-bold text-white mb-1">Crear Nueva Rutina</h1>
                    <p className="text-sm text-white/70 mb-6">Diseña una nueva rutina desde cero.</p>
                </div>
                <div className="px-4 md:px-6 mx-auto w-full flex flex-col h-full overflow-hidden ">
                    <div className="overscroll-contain">
                        <RutinaForm
                            modo="crear"
                            onGuardar={handleGuardarCrear}
                        />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CrearRutina;
