import React from 'react';
import SerieItem from './SerieItem';
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';
import { motion } from 'framer-motion';

const SupersetDisplay = ({ subbloque, lastSessionData, ...props }) => {
    const totalSeries = subbloque.num_series_superset || 1;

    return (
        <div className="space-y-3">
            {Array.from({ length: totalSeries }).map((_, setIndex) => {
                const setNumero = setIndex + 1;

                // Comprobar si todos los ejercicios de esta serie están completos
                const completado = subbloque.subbloques_ejercicios.every((sbe) =>
                    !!props.elementosCompletados[
                    generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumero)
                    ]
                );

                return (
                    <motion.div
                        key={`ss-${subbloque.id}-s${setNumero}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`
              rounded-dashboard p-3 transition-all duration-300 backdrop-blur-md
              border ${completado ? 'border-green-400/30' : 'border-white/10 '}
            `}
                    >
                        <h5 className="font-semibold text-xs text-white/90 mb-2 flex justify-between items-center">
                            <span className="tracking-wide">Superset – Serie {setNumero}</span>
                        
                        </h5>

                        <div className="space-y-2">
                            {subbloque.subbloques_ejercicios.map((sbe) => {
                                const elementoId = generarIdEjercicioEnSerieDeSuperset(
                                    subbloque.id,
                                    sbe.id,
                                    setNumero
                                );
                                const detalleSerie =
                                    sbe.series?.find((s) => s.nro_set === setNumero) || sbe.series?.[0];
                                const reps = detalleSerie?.reps || '';
                                const carga =
                                    detalleSerie?.carga_sugerida || detalleSerie?.carga || '';

                                return (
                                    <SerieItem
                                        key={elementoId}
                                        ref={(el) => {
                                            if (el) props.elementoRefs.current[elementoId] = el;
                                        }}
                                        serieId={elementoId}
                                        textoPrincipal={`${sbe.ejercicio?.nombre || 'Ejercicio'} – ${reps} reps`}
                                        isCompletada={!!props.elementosCompletados[elementoId]}
                                        isActive={props.elementoActivoId === elementoId}
                                        onItemClick={props.toggleElementoCompletado}
                                        reps={reps}
                                        carga={carga}
                                        tipoElemento="superset_ejercicio"
                                        subbloqueId={subbloque.id}
                                        numSerieSupersetActual={setNumero}
                                        lastSessionData={lastSessionData}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SupersetDisplay;
