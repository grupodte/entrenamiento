import React, { useState, useEffect } from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaDumbbell, FaSyncAlt, FaChevronDown, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SubBloqueDisplay = (props) => {
    const { subbloque, isCompleted, isInProgress, hideTitle, lastSessionData } = props;

    // El componente estará colapsado si está completado.
    const [isCollapsed, setIsCollapsed] = useState(isCompleted);

    // Sincronizamos el estado de colapso si la prop isCompleted cambia desde el padre.
    useEffect(() => {
        setIsCollapsed(isCompleted);
    }, [isCompleted]);

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const isSuperset = subbloque?.tipo === 'superset';
    const Icon = isSuperset ? FaSyncAlt : FaDumbbell;
    const typeLabel = isSuperset ? 'SUPERSET' : 'EJERCICIO';

    const borderColor = isSuperset ? 'border-violet-300/30' : 'border-cyan-300/30';
    const borderTopColor = isSuperset ? 'border-violet-300/10' : 'border-cyan-300/10';

    return (
        <section
            role="group"
            aria-label={`${typeLabel} ${subbloque?.nombre ?? ''}`}
            className={`relative rounded-xl backdrop-blur-md border border-[1px] ${borderColor} transition-all duration-300`}
        >
            {/* Encabezado Clickeable */}
            <button
                onClick={handleToggleCollapse}
                className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left"
                aria-expanded={!isCollapsed}
            >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50">
                    {isCompleted ? <FaCheckCircle className="text-base text-green-400" /> : <Icon className="text-base text-gray-400" aria-hidden />}
                </span>

                <div className="flex-1 min-w-0">
                    {!hideTitle && (
                        <h3 className="text-sm font-semibold text-gray-200">
                            {subbloque?.nombre || typeLabel}
                        </h3>
                    )}
                    {isInProgress && !isCompleted && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-600/50 text-gray-300">
                            En progreso
                        </span>
                    )}
                </div>

                {/* Icono de Chevron para indicar expandir/colapsar */}
                <motion.div
                    animate={{ rotate: isCollapsed ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                >
                    <FaChevronDown className="text-gray-400" />
                </motion.div>
            </button>

            {/* Contenido Colapsable con Animación */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className={`p-3 sm:p-4 border-t ${borderTopColor}`}>
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
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default SubBloqueDisplay;
