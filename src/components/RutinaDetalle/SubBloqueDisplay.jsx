import React from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaDumbbell, FaSyncAlt } from 'react-icons/fa';

const SubBloqueDisplay = (props) => {
    const { subbloque, isCompleted, isInProgress, lastSessionData, index } = props;

    const isSuperset = subbloque?.tipo === 'superset';
    const Icon = isSuperset ? FaSyncAlt : FaDumbbell;
    const typeLabel = isSuperset ? 'SUPERSET' : 'EJERCICIO';

    return (
        <section
            role="group"
            aria-label={`${typeLabel} ${subbloque?.nombre ?? ''}`}
            className={[
                // card contenedor
                'relative rounded-xl backdrop-blur-md',
                'border border-[1px] border-cyan-300/30',
                'transition-all duration-300',
                isInProgress ? 'ring-2 ring-gray-400/40' : '',
                isCompleted ? 'opacity-60' : '',
            ].join(' ')}
        >
            {/* Encabezado simplificado */}
            <div className="flex items-center gap-3 px-3 sm:px-4 py-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50">
                    <Icon className="text-base text-gray-400" aria-hidden />
                </span>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-300">
                            {subbloque?.nombre || typeLabel}
                        </h3>

                        {/* Estados más sutiles */}
                        {isInProgress && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-600/50 text-gray-300">
                                En progreso
                            </span>
                        )}
                        {isCompleted && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-400">
                                ✓
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido: ejercicios */}
            <div className="p-3 sm:p-4">
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