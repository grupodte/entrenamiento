import React, { useState, useEffect } from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaDumbbell, FaSyncAlt, FaChevronDown, FaCheckCircle } from 'react-icons/fa';
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
    const Icon = isSuperset ? FaSyncAlt : FaDumbbell;
    const typeLabel = isSuperset ? 'SUPERSET' : 'EJERCICIO';

    const borderColor = isSuperset ? 'border-violet-300/30' : 'border-cyan-300/30';
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
            className={`relative rounded-xl backdrop-blur-md border border-[1px] ${borderColor} transition-all duration-300`}
        >
            {/* Encabezado Clickeable */}
            <button
                onClick={handleToggleCollapse}
                className="w-full flex items-center gap-2 px-2 sm:px-4 py-3 text-left"
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
                    {/* 4. Mostrar resumen si está colapsado */}
                    {isCollapsed && !isInProgress && (
                        <p className="text-xs text-gray-400/80 mt-1">
                            {numEjercicios} {numEjercicios === 1 ? 'Ejercicio' : 'Ejercicios'} / {totalSeries} {totalSeries === 1 ? 'Serie' : 'Series'}
                        </p>
                    )}
                    {isInProgress && !isCompleted && (

                                <ShinyText
                                text=    "En progreso"     
                                speed={3}                                               
                                disabled={false}> 
                                </ShinyText>
                    )}
                </div>

                <motion.div
                    animate={{ rotate: isCollapsed ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                >
                    <FaChevronDown className="text-gray-400" />
                </motion.div>
            </button>

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


