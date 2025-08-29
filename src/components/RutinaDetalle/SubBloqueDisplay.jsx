import React, { useState, useEffect } from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaDumbbell, FaExchangeAlt, FaChevronDown, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ShinyText from '../../components/ShinyText.jsx';


const SubBloqueDisplay = (props) => {
    const { subbloque, isCompleted, isInProgress, hideTitle, lastSessionData } = props;

    // 1. Iniciar siempre colapsado
    const [isCollapsed, setIsCollapsed] = useState(true);

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
    const badgeText = isSuperset ? 'Sin pausa entre ejercicios' : 'Ejercicio simple';

    // Colores diferenciados para cada tipo
    const getContainerStyles = () => {
        if (isCompleted) {
            return isSuperset 
                ? 'bg-gradient-to-r from-violet-900/20 to-violet-800/15 border-violet-600/40'
                : 'bg-gradient-to-r from-cyan-900/20 to-cyan-800/15 border-cyan-600/40';
        }
        if (isInProgress) {
            return isSuperset 
                ? 'bg-gradient-to-r from-violet-900/40 to-violet-800/30 border-violet-500/60 ring-2 ring-violet-400/50 shadow-lg shadow-violet-500/20'
                : 'bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border-cyan-500/60 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20';
        }
        return isSuperset 
            ? 'bg-gradient-to-r from-violet-900/10 to-violet-800/5 border-violet-700/20 hover:from-violet-900/20 hover:to-violet-800/15'
            : 'bg-gradient-to-r from-cyan-900/10 to-cyan-800/5 border-cyan-700/20 hover:from-cyan-900/20 hover:to-cyan-800/15';
    };

    const getSidebarStyles = () => {
        return isSuperset 
            ? 'bg-gradient-to-b from-violet-500 to-violet-700'
            : 'bg-gradient-to-b from-cyan-500 to-cyan-700';
    };

    const getBadgeStyles = () => {
        return isSuperset 
            ? 'bg-violet-600/80 text-violet-100 border-violet-500/50'
            : 'bg-cyan-600/80 text-cyan-100 border-cyan-500/50';
    };

    const borderTopColor = isSuperset ? 'border-violet-300/10' : 'border-cyan-300/10';

    // 3. Calcular información del resumen
    const numEjercicios = subbloque.subbloques_ejercicios?.length || 0;
    const totalSeries = isSuperset
        ? (subbloque.num_series_superset || 0)
        : (subbloque.subbloques_ejercicios?.reduce((acc, sbe) => acc + (sbe.series?.length || 0), 0) || 0);

    return (
        <section
            role="group"
            aria-label={`${typeLabel} ${subbloque?.nombre ?? ''}`}
            className={`relative rounded-lg backdrop-blur-md border transition-all duration-300 ${getContainerStyles()}`}
        >
            {/* Banda lateral sutil */}
            <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${getSidebarStyles()}`} />
            
            {/* Encabezado Clickeable - Optimizado para móvil */}
            <button
                onClick={handleToggleCollapse}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left min-h-[52px] touch-manipulation"
                aria-expanded={!isCollapsed}
            >
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-300 ${
                    isCompleted 
                        ? 'bg-green-600/20 border border-green-500/40' 
                        : isSuperset 
                            ? 'bg-violet-600/20 border border-violet-500/40'
                            : 'bg-cyan-600/20 border border-cyan-500/40'
                }`}>
                    {isCompleted ? (
                        <FaCheckCircle className="text-sm text-green-400" />
                    ) : (
                        <Icon className={`text-sm ${
                            isSuperset ? 'text-violet-400' : 'text-cyan-400'
                        }`} aria-hidden />
                    )}
                </span>

                <div className="flex-1 min-w-0 mr-2">
                    {!hideTitle && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-medium text-white truncate">
                                {subbloque?.nombre || typeLabel}
                            </h3>
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getBadgeStyles()} flex-shrink-0`}>
                                {isSuperset ? 'Sin pausa entre sets' : 'Individual'}
                            </span>
                        </div>
                    )}
                    
                    {/* Info compacta */}
                    {isCollapsed && !isInProgress && (
                        <p className="text-xs text-gray-400 mt-0.5">
                            {numEjercicios}ej • {totalSeries}sets
                        </p>
                    )}
                    
                    {/* Estado en progreso */}
                    {isInProgress && !isCompleted && (
                        <ShinyText
                            text="En progreso"
                            speed={3}
                            disabled={false}
                            className="text-xs"
                        />
                    )}
                </div>

                <motion.div
                    animate={{ rotate: isCollapsed ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                >
                    <FaChevronDown className={`text-sm ${
                        isSuperset ? 'text-violet-400' : 'text-cyan-400'
                    }`} />
                </motion.div>
            </button>

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
                        <div className={`px-3 pb-2 border-t ${borderTopColor}`}>
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


