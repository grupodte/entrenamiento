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
                        aria-labelledby={`title-ss-${subbloque.id}-s${setNumero}`}
                        className={[
                            "relative rounded-2xl overflow-hidden backdrop-blur-md",
                            "border bg-gray-800/30",
                            completado ? "border-gray-500/40 ring-1 ring-gray-400/20" : "border-gray-700/30",
                            "p-3 sm:p-4"
                        ].join(' ')}
                    >
              

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
                                        nroSet={setNumero}
                                        isCompletada={isCompletada}
                                        isActive={isActive}
                                        onItemClick={props.toggleElementoCompletado}
                                        reps={reps}
                                        carga={carga}
                                        tipoElemento="superset_ejercicio"
                                        subbloqueId={subbloque.id}
                                        numSerieSupersetActual={setNumero}
                                        lastSessionData={lastSessionData}
                                        ejercicio={sbe.ejercicio} // Pasar el objeto ejercicio
                                        openVideoPanel={props.openVideoPanel} // Pasar la función para abrir el video
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