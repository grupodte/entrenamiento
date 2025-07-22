import React from 'react';
import { useNavigate } from 'react-router-dom';
import RutinaForm from '../../components/Rutina/RutinaForm';

const CrearRutina = () => {
    const navigate = useNavigate();

    const handleGuardarCrear = (rutinaGuardada) => {
        // Ya se muestra toast en RutinaForm
        navigate('/admin/rutinas');
    };

    return (
        <div className="min-h-[calc(100dvh-4rem)] pb-[90px]  py-6 text-white">
            {/* Encabezado */}
            <div className="max-w-5xl mx-auto ">

            </div>

            {/* Formulario */}
            <div className="max-w-6xl mx-auto">
                <RutinaForm modo="crear" onGuardar={handleGuardarCrear} />
            </div>
        </div>
    );
};

export default CrearRutina;
