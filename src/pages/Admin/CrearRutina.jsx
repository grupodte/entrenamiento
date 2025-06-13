import React from 'react';
import RutinaForm from '../../components/Rutina/RutinaForm';
import AdminLayout from '../../layouts/AdminLayout';

const CrearRutina = () => {
    return (
        <AdminLayout>
            <div className="h-full w-full px-2 md:px-10 text-white overflow-x-hidden"> {/* 👈 evita scroll horizontal */}
                <div className="max-w-5xl mx-auto flex flex-col h-full overflow-hidden ">
                    <div className="flex items-center justify-between">
                        {/* El botón de guardar lo podrías subir acá si lo exponés con forwardRef */}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 overscroll-contain"> {/* 👈 mejora UX de scroll vertical */}
                        <RutinaForm />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CrearRutina;

