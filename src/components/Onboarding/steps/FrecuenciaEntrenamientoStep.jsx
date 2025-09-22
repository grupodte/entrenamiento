import React from 'react';
import { FaDumbbell, FaCalendarWeek } from 'react-icons/fa';
import OptionCard from '../OptionCard';

const FrecuenciaEntrenamientoStep = ({ value, onChange }) => {
    const frecuencias = [
        {
            id: '3_veces',
            title: '3 veces por semana',
            description: 'Ideal para comenzar o mantener un ritmo moderado',
            icon: FaCalendarWeek,
            details: 'Lun • Mié • Vie'
        },
        {
            id: '4_veces',
            title: '4 veces por semana',
            description: 'Para quienes buscan un entrenamiento más intenso',
            icon: FaDumbbell,
            details: 'Lun • Mar • Jue • Sáb'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
                <p className="text-sm text-white/80">
                    <strong className="text-cyan-400">¿Con qué frecuencia quieres entrenar?</strong> Elegir la frecuencia 
                    correcta es clave para mantener la consistencia y obtener resultados.
                </p>
            </div>

            <div className="space-y-4">
                {frecuencias.map((frecuencia) => (
                    <div key={frecuencia.id} className="relative">
                        <OptionCard
                            title={frecuencia.title}
                            description={frecuencia.description}
                            icon={frecuencia.icon}
                            selected={value === frecuencia.id}
                            onClick={() => onChange(frecuencia.id)}
                        />
                        
                        {/* Detalles adicionales */}
                        <div className="mt-2 ml-4 pl-4 border-l-2 border-white/10">
                            <p className="text-sm text-white/60 font-medium">
                                Días sugeridos: <span className="text-cyan-400">{frecuencia.details}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Información adicional */}
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    </div>
                    <div className="text-sm text-white/80">
                        <p className="font-medium mb-1">¿Por qué importa la frecuencia?</p>
                        <p className="text-white/60">
                            La consistencia es más importante que la intensidad. Elige una frecuencia que puedas 
                            mantener a largo plazo. Siempre puedes ajustarla más adelante.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FrecuenciaEntrenamientoStep;
