import React from 'react';
import RutinaForm from '../../components/Rutina/RutinaForm';
import AdminLayout from '../../layouts/AdminLayout';

const CrearRutina = () => {
    return (
        <AdminLayout>
            <div className="w-full min-h-screen flex flex-col bg-neutral-900 text-white">           
                <div className="p-4 mx-auto w-full flex flex-col h-full overflow-hidden ">
                    <div className="flex items-center justify-between">
                        {/* El botón de guardar lo podrías subir acá si lo exponés con forwardRef */}
                    </div>

                    <div className=" overscroll-contain"> {/* 👈 mejora UX de scroll vertical */}
                        <RutinaForm />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CrearRutina;

