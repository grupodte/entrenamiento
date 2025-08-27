// src/components/RutinaDetalle/SupersetDisplay.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SerieItem from './SerieItem';
import { generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';

const SupersetDisplay = ({ subbloque, lastSessionData, ...props }) => {
    const totalSeries = subbloque.num_series_superset || 1;

    const handleToggleSupersetSet = (setNumero) => {
        const childIds = subbloque.subbloques_ejercicios.map(sbe =>
            generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumero)
        );

        let pausaSet = subbloque.pausa_compartida || 0;
        if (!pausaSet) {
            subbloque.subbloques_ejercicios.forEach(sbe => {
                const detalleSerie = sbe.series?.find(s => s.nro_set === setNumero) || sbe.series?.[0];
                if (detalleSerie?.pausa > pausaSet) {
                    pausaSet = detalleSerie.pausa;
                }
            });
        }

        props.toggleElementoCompletado({
            tipoElemento: 'superset_set',
            childIds: childIds,
            pausa: pausaSet
        });
    };

    return (
        <div className="space-y-2">
            {Array.from({ length: totalSeries }).map((_, setIndex) => {
                const setNumero = setIndex + 1;

                const primerIdDelSet = subbloque.subbloques_ejercicios.length > 0
                    ? generarIdEjercicioEnSerieDeSuperset(subbloque.id, subbloque.subbloques_ejercicios[0].id, setNumero)
                    : null;
                const completado = primerIdDelSet ? !!props.elementosCompletados[primerIdDelSet] : false;

                const isActive = subbloque.subbloques_ejercicios.some(sbe =>
                    generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumero) === props.elementoActivoId
                );

                return (
                    <motion.section
                        key={`ss-${subbloque.id}-s${setNumero}`}
                        aria-labelledby={`title-ss-${subbloque.id}-s${setNumero}`}
                        onClick={() => handleToggleSupersetSet(setNumero)}
                        className={[
                            "relative rounded-2xl overflow-hidden backdrop-blur-md cursor-pointer transition-all duration-300",
                            "border",
                            completado
                                ? 'bg-violet-900/50 border-violet-700/50'
                                : isActive
                                    ? 'bg-violet-900/40 border-violet-600/60 ring-2 ring-violet-500/50'
                                    : 'bg-violet-900/30 border-violet-800/40 hover:bg-violet-900/40',
                            "p-3 sm:p-4"
                        ].join(' ')}
                    >
                        <div className="space-y-3 pointer-events-none">
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
                                const pausa = subbloque.pausa_compartida || detalleSerie?.pausa || 0;
                                const isCompletada = !!props.elementosCompletados[elementoId];

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
                                        isActive={props.elementoActivoId === elementoId}
                                        reps={reps}
                                        carga={carga}
                                        pausa={pausa}
                                        tipoElemento="superset_ejercicio"
                                        subbloqueId={subbloque.id}
                                        numSerieSupersetActual={setNumero}
                                        lastSessionData={lastSessionData}
                                        ejercicio={sbe.ejercicio}
                                        openVideoPanel={props.openVideoPanel}
                                        classNameExtra="!cursor-default"
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