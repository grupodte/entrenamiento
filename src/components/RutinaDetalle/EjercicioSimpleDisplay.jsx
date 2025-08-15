import React from 'react';
import SerieItem from './SerieItem';
import { generarIdSerieSimple } from '../../utils/rutinaIds';

const EjercicioSimpleDisplay = ({ sbe, subbloqueId, lastSessionData, ...props }) => {
    const ejercicio = sbe.ejercicio;

    return (
        <div className="space-y-3">
            {/* Header opcional del ejercicio si hay múltiples series */}
            {sbe.series?.length > 1 && (
                <div className="px-1">
                    <h4 className="font-semibold text-white/90 text-sm tracking-wide">
                        {ejercicio?.nombre || 'Ejercicio'}
                    </h4>
                </div>
            )}

            {/* Series */}
            {sbe.series?.map(serie => {
                const serieId = generarIdSerieSimple(subbloqueId, sbe.id, serie.nro_set);

                // Para ejercicios simples, mostramos el nombre del ejercicio en cada SerieItem
                const textoPrincipal = sbe.series?.length === 1
                    ? `${ejercicio?.nombre || 'Ejercicio'}`
                    : `${ejercicio?.nombre || 'Ejercicio'} - Serie ${serie.nro_set}`;

                return (
                    <SerieItem
                        key={serieId}
                        ref={el => { if (el) props.elementoRefs.current[serieId] = el; }}
                        serieId={serieId}
                        textoPrincipal={textoPrincipal}
                        isCompletada={!!props.elementosCompletados[serieId]}
                        isActive={props.elementoActivoId === serieId}
                        onItemClick={props.toggleElementoCompletado}
                        reps={serie.reps}
                        carga={serie.carga_sugerida || serie.carga}
                        pausa={serie.pausa}
                        tipoElemento={'simple'}
                        lastSessionData={lastSessionData}
                    />
                );
            })}
        </div>
    );
};

export default EjercicioSimpleDisplay;