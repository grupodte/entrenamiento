import React, { useState, useEffect } from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaDumbbell, FaExchangeAlt, FaChevronDown, FaCheckCircle, FaMinus, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ShinyText from '../../components/ShinyText.jsx';


const SubBloqueDisplay = (props) => {
    const { subbloque, isCompleted, isInProgress, hideTitle, lastSessionData, blockTheme, blockNumber, blockName } = props;

    // 1. Iniciar siempre expandido para el nuevo diseño
    const [isCollapsed, setIsCollapsed] = useState(false);

    // 2. Sincronizar solo para colapsar cuando se completa, no para expandir
    useEffect(() => {
        if (isCompleted) {
            setIsCollapsed(true);
        }
    }, [isCompleted]);

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const isSuperset = subbloque?.tipo === 'superset';
    const Icon = isSuperset ? FaExchangeAlt : FaDumbbell;
    const typeLabel = isSuperset ? 'SUPERSET' : 'EJERCICIO SIMPLE';

    // 3. Calcular información del resumen
    const numEjercicios = subbloque.subbloques_ejercicios?.length || 0;
    const totalSeries = isSuperset
        ? (subbloque.num_series_superset || 0)
        : (subbloque.subbloques_ejercicios?.reduce((acc, sbe) => acc + (sbe.series?.length || 0), 0) || 0);
    
    // Calcular progreso actual
    const completedSets = isCompleted ? totalSeries : 0;

    return (
        <motion.div
            className={`relative rounded-2xl bg-gray-200 p-4 shadow-sm ${
                isCompleted ? 'opacity-70' : ''
            }`}
            layout
        >
            {/* Header de la tarjeta */}
            <button
                onClick={handleToggleCollapse}
                className="w-full flex items-center justify-between mb-3 touch-manipulation"
                aria-expanded={!isCollapsed}
            >
                <div className="flex items-center gap-3">
                    {/* Icono circular */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        blockTheme?.iconColor || 'bg-red-500'
                    }`}>
                        {isCompleted ? (
                            <FaCheckCircle className="text-white text-sm" />
                        ) : (
                            <Icon className={`text-white text-sm ${blockTheme?.iconColorClass || 'text-white'}`} />
                        )}
                    </div>
                    
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {blockName ? (
                                blockName
                            ) : blockNumber && !hideTitle ? (
                                `Bloque ${blockNumber}`
                            ) : (
                                subbloque?.nombre || typeLabel
                            )}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {numEjercicios} {isSuperset ? 'ejercicios' : 'ejercicio'} • {completedSets}/{totalSeries} sets
                        </p>
                    </div>
                </div>

                {/* Botón colapsar */}
                <div className="flex-shrink-0 ml-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        {isCollapsed ? (
                            <FaPlus className="text-gray-600 text-xs" />
                        ) : (
                            <FaMinus className="text-gray-600 text-xs" />
                        )}
                    </div>
                </div>
            </button>

            {/* Estado en progreso */}
            {isInProgress && !isCompleted && (
                <div className="mb-3">
                    <div className="text-xs text-red-500 font-medium uppercase tracking-wide">
                        En progreso
                    </div>
                </div>
            )}

            {/* Contenido expandible */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3 border-t border-gray-300">
                            {subbloque?.tipo === 'simple' &&
                                subbloque?.subbloques_ejercicios?.map((sbe) => (
                                    <EjercicioSimpleDisplay
                                        key={sbe.id}
                                        sbe={sbe}
                                        subbloqueId={subbloque.id}
                                        {...props}
                                        lastSessionData={lastSessionData}
                                        blockTheme={blockTheme}
                                    />
                                ))}

                            {subbloque?.tipo === 'superset' && (
                                <SupersetDisplay
                                    subbloque={subbloque}
                                    {...props}
                                    lastSessionData={lastSessionData}
                                    blockTheme={blockTheme}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SubBloqueDisplay;


