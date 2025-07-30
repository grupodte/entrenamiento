import React from 'react';
import SerieItem from './SerieItem';
import { generarIdSerieSimple } from '../../utils/rutinaIds';

const EjercicioSimpleDisplay = ({ sbe, subbloqueId, ...props }) => {
    const ejercicio = sbe.ejercicio;

    return (
        <div className="bg-gray-800/50 p-2.5 rounded-md">
            <h4 className="font-semibold text-white mb-2 text-sm">{ejercicio?.nombre || 'Ejercicio'}</h4>
            <div className="space-y-1.5">
                {sbe.series?.map(serie => {
                    const serieId = generarIdSerieSimple(subbloqueId, sbe.id, serie.nro_set);
                    return (
                        <SerieItem
                            key={serieId}
                            ref={el => { if (el) props.elementoRefs.current[serieId] = el; }}
                            serieId={serieId}
                            textoPrincipal={`Serie ${serie.nro_set}: ${serie.reps} reps`}
                            isCompletada={!!props.elementosCompletados[serieId]}
                            isActive={props.elementoActivoId === serieId}
                            onItemClick={() => props.toggleElementoCompletado(serieId, {
                                tipoElemento: 'simple',
                                pausa: serie.pausa
                            })}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default EjercicioSimpleDisplay;
