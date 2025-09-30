import React from 'react';
import { FaDumbbell, FaCalendarWeek } from 'react-icons/fa';

const FrecuenciaEntrenamientoStep = ({ value, onChange }) => {
    const frecuencias = [
        {
            id: '3_veces',
            title: '3 veces por semana',
            details: 'Lun • Mié • Vie',
            icon: FaCalendarWeek,
        },
        {
            id: '4_veces',
            title: '4 veces por semana',
            details: 'Lun • Mar • Jue • Sáb',
            icon: FaDumbbell,
        },
    ];

    const Card = ({ id, title, details, Icon }) => {
        const selected = value === id;
        return (
            <button
                type="button"
                onClick={() => onChange(id)}
                className={[
                    // base
                    'group w-full text-left rounded-2xl transition-all duration-200',
                    'bg-[#191919] border backdrop-blur-sm',
                    'p-4 md:p-5',
                    // borders/shadows
                    selected
                        ? 'border-[#FF0000]/60 shadow-[0_6px_30px_rgba(255,0,0,0.20)]'
                        : 'border-white/10 hover:border-white/20 hover:shadow-[0_6px_30px_rgba(0,0,0,0.35)]',
                ].join(' ')}
            >
                <div className="flex items-start gap-3">
               
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium leading-none text-[16px]">
                            {title}
                        </h4>
                        <p className="mt-2 text-[13px] text-white/60">
                            Días sugeridos:{' '}
                            <span className={selected ? 'text-[#FF0000]' : 'text-white/80'}>
                                {details}
                            </span>
                        </p>
                    </div>

                    {/* indicador seleccionado */}
                    <div
                        className={[
                            'w-2.5 h-2.5 rounded-full',
                            selected ? 'bg-[#FF0000]' : 'bg-white/15 group-hover:bg-white/25',
                        ].join(' ')}
                    />
                </div>
            </button>
        );
    };

    return (
        <div className="space-y-8">
    

            {/* grid en 2 columnas también en mobile */}
            <div className="grid grid-cols gap-3 md:gap-4">
                {frecuencias.map((f) => (
                    <Card
                        key={f.id}
                        id={f.id}
                        title={f.title}
                        details={f.details}
                        Icon={f.icon}
                    />
                ))}
            </div>
        </div>
    );
};

export default FrecuenciaEntrenamientoStep;
