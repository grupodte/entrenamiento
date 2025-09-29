import React, { useState, useEffect } from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaDumbbell, FaExchangeAlt, FaChevronDown, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ShinyText from '../../components/ShinyText.jsx';


const SubBloqueDisplay = (props) => {
    const { subbloque, isCompleted, isInProgress, hideTitle, lastSessionData, blockTheme, blockNumber } = props;

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
        // Base: fondo muy oscuro + sutil glow púrpura y borde fino
        const base =
      ' '

        if (isCompleted) {
            // Un poco menos intenso, como “apagado” pero aún con halo
            return (
                base +
                ' border-[#7C3AED80] ' +
           'bg-black'
             
            );
        }

        if (isInProgress) {
            // Estado activo: más brillo y contraste
            return (
                base +
                ' border-[#FFFFFF] ' 
            );
        }

        // Idle / hover suave
        return (
            base +
            ' '
        );
    };


    const getSidebarStyles = () => {
        return isSuperset 
            ? ''
            : '';
    };

    const getBadgeStyles = () => {
        return isSuperset 
            ? 'bg-[#C6C6C6] border-[#FFFFFF ] '
            : 'bg-cyan-600/80 text-cyan-100 border-cyan-500/50';
    };

    const borderTopColor = isSuperset ? 'border-violet-300/0' : 'border-cyan-300/0';

    // 3. Calcular información del resumen
    const numEjercicios = subbloque.subbloques_ejercicios?.length || 0;
    const totalSeries = isSuperset
        ? (subbloque.num_series_superset || 0)
        : (subbloque.subbloques_ejercicios?.reduce((acc, sbe) => acc + (sbe.series?.length || 0), 0) || 0);

    return (
        <section
            role="group"
            aria-label={`${typeLabel} ${subbloque?.nombre ?? ''}`}
            className={`relative ${getContainerStyles()}`}
        >
            
            {/* Encabezado Clickeable - Optimizado para móvil */}
            <button
                onClick={handleToggleCollapse}
                className="w-full flex items-center  flex   touch-manipulation"
                aria-expanded={!isCollapsed}
            >
             
                <div className="flex-1 min-w-0 mr-2">
                    {!hideTitle && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-medium text-white truncate">
                                {blockNumber && blockTheme ? (
                                    <span className={blockTheme.titleColor}>
                                        Bloque {blockNumber}
                                    </span>
                                ) : (
                                    subbloque?.nombre || typeLabel
                                )}
                            </h3>
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getBadgeStyles()} flex-shrink-0`}>
                                {numEjercicios}ej • {totalSeries}sets
                            </span>
                        </div>
                    )}
                    
                    {/* Info compacta - mostrar número de bloque */}
                    {isCollapsed && !isInProgress && blockNumber && (
                        <p className={`text-xs mt-0.5 ${blockTheme ? blockTheme.titleColor : 'text-gray-400'} opacity-80`}>
                            Bloque {blockNumber}
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
                    <FaChevronDown className={`text-sm text-white/20`} />
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


