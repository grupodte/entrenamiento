import React, { useState, useEffect } from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaDumbbell, FaExchangeAlt, FaChevronDown, FaCheckCircle, FaMinus, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ShinyText from '../../components/ShinyText.jsx';
import { generarIdEjercicioEnSerieDeSuperset, generarIdSerieSimple } from '../../utils/rutinaIds';
import tickRutina from '../../assets/tick-rutina.svg';
import ondaRutina from '../../assets/onda-rutina.svg';
import banderaRutina from '../../assets/bandera-rutina.svg';


const SubBloqueDisplay = (props) => {
    const { subbloque, isCompleted, isInProgress, hideTitle, lastSessionData, blockTheme, blockNumber, blockName } = props;

    // 1. Iniciar siempre colapsado para el nuevo diseño
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
    
    // Función para obtener el icono apropiado
    const getIcon = () => {
        if (isCompleted) {
            return tickRutina; // Bloque completado
        } else if (isSuperset) {
            return banderaRutina; // Superset
        } else {
            return ondaRutina; // Ejercicio simple
        }
    };

    // 3. Calcular información del resumen
    const numEjercicios = subbloque.subbloques_ejercicios?.length || 0;
    const totalSeries = isSuperset
        ? (subbloque.num_series_superset || 0)
        : (subbloque.subbloques_ejercicios?.reduce((acc, sbe) => acc + (sbe.series?.length || 0), 0) || 0);
    
    // Calcular progreso actual
    const completedSets = (() => {
        if (isCompleted) return totalSeries;
        
        if (isSuperset) {
            // Para supersets, contar cuántos sets del superset están completados
            let completed = 0;
            const totalSupersetSets = subbloque.num_series_superset || 0;
            
            for (let setNum = 1; setNum <= totalSupersetSets; setNum++) {
                // Generar el ID del primer ejercicio de cada set del superset
                if (subbloque.subbloques_ejercicios?.length > 0) {
                    const firstExerciseId = generarIdEjercicioEnSerieDeSuperset(
                        subbloque.id,
                        subbloque.subbloques_ejercicios[0].id,
                        setNum
                    );
                    if (props.elementosCompletados?.[firstExerciseId]) {
                        completed++;
                    }
                }
            }
            return completed;
        } else {
            // Para ejercicios simples, contar todos los sets completados
            let completed = 0;
            subbloque.subbloques_ejercicios?.forEach(sbe => {
                sbe.series?.forEach(serie => {
                    const serieId = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                    if (props.elementosCompletados?.[serieId]) {
                        completed++;
                    }
                });
            });
            return completed;
        }
    })();

    return (
        <div
            className={`relative rounded-[10px] bg-[#D8D8D8] max-w-[370px] min-h-[87px] justify-center items-center flex flex-col transition-opacity duration-200 ease-in-out ${
                isCompleted ? 'opacity-60' : '' 
            }`}
        >
            {/* Header de la tarjeta */}
            <div
                className="w-full flex items-center justify-between  cursor-pointe bg-[#F6F5F5] w-[#370] h-[87px] px-4 rounded-[10px]  "
                onClick={handleToggleCollapse}
            >
                <div className="flex items-center gap-3">
                    {/* Icono circular */}
                    <div className={`w-[45px] h-[45px] rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-[#47D065]' : (blockTheme?.iconColor || 'bg-[#F04444]')
                    }`}>
                        <img 
                            src={getIcon()} 
                            alt={isCompleted ? 'Completado' : (isSuperset ? 'Superset' : 'Ejercicio simple')}
                            className="w-5 h-5"
                        />
                    </div>
                    
                    <div className="flex-1 text-left">
                        <h3 className="text-[27px] text-[#818181]">
                            {blockName ? (
                                blockName
                            ) : blockNumber && !hideTitle ? (
                                `Bloque ${blockNumber}`
                            ) : (
                                subbloque?.nombre || typeLabel
                            )}
                        </h3>
                        <p className="text-[13px] text-[#818181]">
                            {numEjercicios} {isSuperset ? 'ejercicios' : 'ejercicio'} • {completedSets}/{totalSeries} sets
                        </p>
                    </div>
                </div>

                {/* Botón colapsar */}
                <button
                    className="flex-shrink-0 "
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? 'Expandir bloque' : 'Colapsar bloque'}
                >
                    <div className="w-[29px] h-[29px] rounded-full bg-[#C3C3C3] flex items-center justify-center">
                        {isCollapsed ? (
                            <FaPlus className="text-[#595959] text-xs" />
                        ) : (
                                <FaMinus className="text-[#595959] text-xs" />
                        )}
                    </div>
                </button>
            </div>

            {/* Contenido expandible */}
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden w-full"
                    >
                        <div className="pt-4">
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
        </div>
    );
};

export default SubBloqueDisplay;


