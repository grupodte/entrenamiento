import React from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaFire, FaSyncAlt } from 'react-icons/fa';

const SubBloqueDisplay = (props) => {
    const { subbloque, isCompleted, isInProgress, lastSessionData } = props;

    const isSuperset = subbloque?.tipo === 'superset';
    const Icon = isSuperset ? FaSyncAlt : FaFire;
    const typeLabel = isSuperset ? 'SUPERSET' : 'SIMPLE';

    // Paleta simplificada
    const accent = isSuperset
        ? {
            ring: 'ring-cyan-400/40',
            borderL: 'border-l-cyan-400/60',
            grad: 'from-cyan-500/20 to-cyan-600/10',
            text: 'text-cyan-300',
            iconBg: 'bg-cyan-500/15',
        }
        : {
            ring: 'ring-gray-400/40',
            borderL: 'border-l-gray-400/60',
            grad: 'from-gray-500/20 to-gray-600/10',
            text: 'text-gray-300',
            iconBg: 'bg-gray-500/15',
        };

    return (
        <section
            role="group"
            aria-label={`${typeLabel} ${subbloque?.nombre ?? ''}`}
            className={[
                // card contenedor
                'relative mt-4 rounded-2xl bg-gray-800/20 backdrop-blur-md',
                'border border-gray-700/40',
                'transition-all duration-300',
                'hover:bg-gray-800/30',
                isInProgress ? `ring-2 ${accent.ring}` : '',
                isCompleted ? 'opacity-70' : '',
            ].join(' ')}
        >
            {/* Encabezado grande con el TIPO */}
            <div
                className={[
                    'flex items-center gap-3 px-5 py-4',
                    'rounded-t-2xl',
                    'border-l-4',
                    accent.borderL,
                    'bg-gradient-to-r',
                    accent.grad,
                ].join(' ')}
            >
                <span
                    className={[
                        'inline-flex items-center justify-center',
                        'w-10 h-10 rounded-full',
                        accent.iconBg,
                    ].join(' ')}
                >
                    <Icon className="text-lg text-white" aria-hidden />
                </span>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3
                            className={[
                                'text-base font-bold tracking-wide',
                                accent.text,
                                'uppercase',
                            ].join(' ')}
                        >
                            {typeLabel}
                        </h3>

                        {/* Badges de estado */}
                        {isInProgress && (
                            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300">
                                En progreso
                            </span>
                        )}
                        {isCompleted && (
                            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-gray-500/15 text-gray-300">
                                Completado
                            </span>
                        )}
                    </div>

                    {/* Nombre del subbloque debajo, más discreto */}
                    <p className="mt-1 text-sm text-gray-300/80 truncate">
                        {subbloque?.nombre || 'Sub-bloque'}
                    </p>
                </div>
            </div>

            {/* Contenido: ejercicios */}
            <div className="p-4 space-y-3">
                {subbloque?.tipo === 'simple' &&
                    subbloque?.subbloques_ejercicios?.map((sbe) => (
                        <EjercicioSimpleDisplay
                            key={sbe.id}
                            sbe={sbe}
                            subbloqueId={subbloque.id}
                            {...props}
                            lastSessionData={lastSessionData}
                        />
                    ))}

                {subbloque?.tipo === 'superset' && (
                    <SupersetDisplay
                        subbloque={subbloque}
                        {...props}
                        lastSessionData={lastSessionData}
                    />
                )}
            </div>
        </section>
    );
};

export default SubBloqueDisplay;