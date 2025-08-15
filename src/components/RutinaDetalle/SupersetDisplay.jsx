// src/components/RutinaDetalle/SupersetDisplay.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SerieItem from './SerieItem';
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';


const SupersetDisplay = ({ subbloque, lastSessionData, ...props }) => {
    const totalSeries = subbloque.num_series_superset || 1;
    const totalEjercicios = subbloque.subbloques_ejercicios?.length || 0;

    return (
        <div className="space-y-2">
            {Array.from({ length: totalSeries }).map((_, setIndex) => {
                const setNumero = setIndex + 1;

                // Progreso por serie
                const checks = subbloque.subbloques_ejercicios.map((sbe) => {
                    const id = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumero);
                    return !!props.elementosCompletados[id];
                });
                const completadas = checks.filter(Boolean).length;
                const completado = completadas === totalEjercicios;
                const parcial = completadas > 0 && !completado;
                const progressPct = totalEjercicios > 0 ? Math.round((completadas / totalEjercicios) * 100) : 0;

                return (
                    <motion.section
                        key={`ss-${subbloque.id}-s${setNumero}`}
                        initial={{ opacity: 1, y: 8, height: 'auto', marginBottom: '1rem' }}
                        animate={completado ? {
                            opacity: 1,
                            y: 0,
                            height: 'auto',
                            marginBottom: '1rem',
                            transition: { duration: 0.25 }
                        } : {
                            opacity: 1,
                            y: 0,
                            height: 'auto',
                            marginBottom: '1rem',
                            transition: { duration: 0.25 }
                        }}
                        // Animación de desaparición después de un delay
                        exit={completado ? {
                            opacity: 0,
                            height: 0,
                            marginBottom: 0,
                            transition: {
                                opacity: { duration: 0.2, delay: 1 },
                                height: { duration: 0.2, delay: 1.2 },
                                marginBottom: { duration: 0.4, delay: 1.3 }
                            }
                        } : {}}
                        aria-labelledby={`title-ss-${subbloque.id}-s${setNumero}`}
                        className={[
                            "relative rounded-2xl overflow-hidden backdrop-blur-md",
                            "border bg-gray-800/30",
                            completado ? "border-gray-500/40 ring-1 ring-gray-400/20" : "border-gray-700/30",
                            "p-3 sm:p-4"
                        ].join(' ')}
                    >
              

                        {/* Encabezado de la serie */}
                        <header className="my-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {/* Número/Chip de Serie */}
                                <div
                                    className="h-10 w-20 shrink-0 rounded-xl grid place-items-center font-bold text-sm bg-gray-700/50 text-gray-300 border border-gray-600/30"
                                    aria-hidden
                                >
                                   Serie {setNumero}
                                </div>

                                <div>
                                   
                                    <div className="flex items-center gap-2 ">
                                        {completado && (
                                            <span className="text-green-300 text-xs font-medium">Completada ✓</span>
                                        )}
                                        {parcial && (
                                            <span className="text-cyan-300 text-xs font-medium">En progreso...</span>
                                        )}
                                      
                                    </div>
                                </div>
                            </div>

                            {/* Porcentaje */}
                            <div className="text-right">
                                <span className="block text-sm font-bold text-gray-300">{progressPct}%</span>
                            </div>
                        </header>


                        {/* Lista de ejercicios de la serie */}
                        <div className="space-y-3 ">
                            {subbloque.subbloques_ejercicios.map((sbe) => {
                                const elementoId = generarIdEjercicioEnSerieDeSuperset(
                                    subbloque.id,
                                    sbe.id,
                                    setNumero
                                );

                                const detalleSerie =
                                    sbe.series?.find((s) => s.nro_set === setNumero) || sbe.series?.[0];
                                const reps = detalleSerie?.reps || '';
                                const carga = detalleSerie?.carga_sugerida || detalleSerie?.carga || '';

                                const isCompletada = !!props.elementosCompletados[elementoId];
                                const isActive = props.elementoActivoId === elementoId;

                                return (
                                    <SerieItem
                                        key={elementoId}
                                        ref={(el) => {
                                            if (el) props.elementoRefs.current[elementoId] = el;
                                        }}
                                        serieId={elementoId}
                                        textoPrincipal={`${sbe.ejercicio?.nombre || 'Ejercicio'}`}
                                        isCompletada={isCompletada}
                                        isActive={isActive}
                                        onItemClick={props.toggleElementoCompletado}
                                        reps={reps}
                                        carga={carga}
                                        tipoElemento="superset_ejercicio"
                                        subbloqueId={subbloque.id}
                                        numSerieSupersetActual={setNumero}
                                        lastSessionData={lastSessionData}
                                        shouldDisappear={true}
                                        // Estética por serie (bordes/hover diferenciados)
                                        classNameExtra={[
                                            "transition-all duration-300",
                                            isActive ? "ring-1 ring-gray-400/20" : "",
                                        ].join(' ')}
                                    />
                                );
                            })}
                        </div>
                    </motion.section>
                );
            })}
        </div>
    );
};

export default SupersetDisplay;