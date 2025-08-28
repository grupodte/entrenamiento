import React from 'react';
import SerieItem from './SerieItem';
import { generarIdSerieSimple } from '../../utils/rutinaIds';

const EjercicioSimpleDisplay = ({ sbe, subbloqueId, lastSessionData, ...props }) => {
    const ejercicio = sbe.ejercicio;

    return (
        <div className="space-y-3">
          
            {/* Series */}
            {sbe.series?.map(serie => {
                const serieId = generarIdSerieSimple(subbloqueId, sbe.id, serie.nro_set);

                const textoPrincipal = ejercicio?.nombre || 'Ejercicio';

                return (
                    <SerieItem
                        key={serieId}
                        ref={el => { if (el) props.elementoRefs.current[serieId] = el; }}
                        serieId={serieId}
                        textoPrincipal={textoPrincipal}
                        nroSet={serie.nro_set}
                        ejercicio={ejercicio} // Pasar el objeto ejercicio
                        openVideoPanel={props.openVideoPanel} // Pasar la función para abrir el video
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