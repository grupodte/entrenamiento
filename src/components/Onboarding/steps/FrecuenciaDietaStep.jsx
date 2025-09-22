import React from 'react';
import { FaUtensils, FaClock, FaPause } from 'react-icons/fa';

const FrecuenciaDietaStep = ({ value, onChange }) => {
    // TODO: Este componente está en pausa mientras se define la funcionalidad completa
    // Las opciones siguientes son solo un placeholder para futura implementación
    
    // const frecuenciasDieta = [
    //     {
    //         id: 'seguimiento_diario',
    //         title: 'Seguimiento diario',
    //         description: 'Registra tus comidas todos los días',
    //         icon: FaUtensils
    //     },
    //     {
    //         id: 'seguimiento_semanal',
    //         title: 'Seguimiento semanal',
    //         description: 'Revisa tu alimentación una vez por semana',
    //         icon: FaClock
    //     }
    // ];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
                <p className="text-sm text-white/80">
                    <strong className="text-cyan-400">Seguimiento nutricional:</strong> Estamos preparando 
                    funcionalidades increíbles para ayudarte con tu alimentación.
                </p>
            </div>

            {/* Mensaje de "en desarrollo" */}
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center">
                    <FaPause className="w-8 h-8 text-yellow-400" />
                </div>
                
                <div className="text-center space-y-3">
                    <h3 className="text-xl font-semibold text-white/90">
                        Funcionalidad en desarrollo
                    </h3>
                    <p className="text-white/70 max-w-md">
                        Estamos trabajando en herramientas avanzadas para el seguimiento nutricional. 
                        Por ahora, puedes continuar y configurar esto más tarde desde tu perfil.
                    </p>
                </div>
            </div>

            {/* Información sobre qué viene */}
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <h4 className="text-white/90 font-semibold mb-3 flex items-center">
                    <FaUtensils className="w-4 h-4 mr-2 text-cyan-400" />
                    Próximamente:
                </h4>
                <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-3"></div>
                        Registro de comidas personalizado
                    </li>
                    <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-3"></div>
                        Planes nutricionales adaptativos
                    </li>
                    <li className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-3"></div>
                        Análisis de macronutrientes
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default FrecuenciaDietaStep;
