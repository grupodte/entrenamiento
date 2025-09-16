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
            'relative rounded-2xl border text-white/90 transition-all duration-300 backdrop-blur-sm ' +
            'bg-gradient-to-b from-[#121018] to-[#0A0A0F] ' + // fondo oscuro con leve gradiente
            'border-[#7C3AED40] ring-1 ring-inset ring-[#A855F71f] ' + // borde/línea interior suave
            'shadow-[inset_0_0_0_1px_rgba(168,85,247,0.25),0_0_18px_rgba(124,58,237,0.25)] ' + // glow doble
            'hover:ring-[#A855F74d] hover:shadow-[inset_0_0_0_1px_rgba(168,85,247,0.35),0_0_24px_rgba(124,58,237,0.35)]';

        if (isCompleted) {
            // Un poco menos intenso, como “apagado” pero aún con halo
            return (
                base +
                ' border-[#7C3AED80] ' +
                'shadow-[inset_0_0_0_1px_rgba(168,85,247,0.32),0_0_22px_rgba(124,58,237,0.28)] ' +
                'from-[#120E1C] to-[#0A0912]'
            );
        }

        if (isInProgress) {
            // Estado activo: más brillo y contraste
            return (
                base +
                ' border-[#A855F7B3] ' +
                'shadow-[inset_0_0_0_1px_rgba(168,85,247,0.5),0_0_36px_rgba(168,85,247,0.45)] ' +
                'from-[#1A1326] to-[#0E0B15]'
            );
        }

        // Idle / hover suave
        return (
            base +
            ' hover:from-[#171223] hover:to-[#0E0B15]'
        );
    };


    const getSidebarStyles = () => {
        return isSuperset 
            ? ''
            : '';
    };

    const getBadgeStyles = () => {
        return isSuperset 
            ? 'bg-violet-600/10 text-violet-100 border-violet-500/10'
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


