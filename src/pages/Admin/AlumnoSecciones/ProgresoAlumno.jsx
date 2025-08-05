import React from 'react';

const ProgresoAlumno = ({ alumnoId }) => {
    return (
        <div className="p-6 bg-white/5 rounded-lg backdrop-blur border border-white/10">
            <h2 className="text-xl font-bold mb-4 text-white">Progreso del Alumno</h2>
            <div className="text-white/70">
                <p>Esta sección mostrará el progreso y estadísticas del alumno.</p>
                <p className="mt-2">Funcionalidades futuras:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Gráficas de progreso</li>
                    <li>Historial de rutinas completadas</li>
                    <li>Métricas de rendimiento</li>
                    <li>Comparativas temporales</li>
                </ul>
            </div>
        </div>
    );
};

export default ProgresoAlumno;
