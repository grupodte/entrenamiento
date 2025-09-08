// src/componentes/Rutina/SeriesInput.jsx
import React from 'react';
import { EXECUTION_TYPES, getExecutionTypeConfig } from '../../constants/executionTypes';

const SeriesInput = ({ serie, index, onChange }) => {
    // Asegurar que siempre tengamos un tipo de ejecución válido
    const tipoEjecucion = serie.tipo_ejecucion || EXECUTION_TYPES.STANDARD;
    const config = getExecutionTypeConfig(tipoEjecucion);
    
    // DEBUG: Log de props recibidas
    console.log(`[SeriesInput DEBUG] Serie ${index + 1}:`, {
        serie,
        tipoEjecucionCalculado: tipoEjecucion,
        tipoOriginal: serie.tipo_ejecucion
    });
    
    const handleTipoEjecucionChange = (nuevoTipo) => {
        console.log(`[SeriesInput DEBUG] Cambiando tipo de ejecución serie ${index + 1}:`, {
            tipoAnterior: tipoEjecucion,
            tipoNuevo: nuevoTipo,
            serieOriginal: serie
        });
        
        const nuevaSerie = {
            ...serie,
            tipo_ejecucion: nuevoTipo
        };
        
        // Limpiar campos que no aplican para el nuevo tipo
        if (nuevoTipo === EXECUTION_TYPES.TIEMPO) {
            nuevaSerie.reps = '';
        } else if (nuevoTipo === EXECUTION_TYPES.FALLO) {
            nuevaSerie.reps = '';
            nuevaSerie.duracion_segundos = '';
        } else { // STANDARD
            nuevaSerie.duracion_segundos = '';
        }
        
        console.log(`[SeriesInput DEBUG] Enviando nueva serie:`, nuevaSerie);
        onChange(index, nuevaSerie);
    };
    
    return (
        <div className="space-y-2">
            {/* Selector de tipo de ejecución */}
            <div className="flex gap-1">
                {Object.values(EXECUTION_TYPES).map((tipo) => {
                    const typeConfig = getExecutionTypeConfig(tipo);
                    return (
                        <button
                            key={tipo}
                            type="button"
                            onClick={() => handleTipoEjecucionChange(tipo)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                tipoEjecucion === tipo
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                        >
                            {typeConfig.label}
                        </button>
                    );
                })}
            </div>
            
            {/* Campos dinámicos según tipo de ejecución */}
            <div className="grid gap-1 text-white" style={{ gridTemplateColumns: `repeat(${tipoEjecucion === EXECUTION_TYPES.TIEMPO ? 3 : 4}, 1fr)` }}>
                {/* Campo principal según tipo */}
                {tipoEjecucion === EXECUTION_TYPES.STANDARD && (
                    <input
                        value={serie.reps || ''}
                        onChange={(e) => onChange(index, { ...serie, reps: e.target.value })}
                        placeholder="Reps"
                        type="number"
                        className="rounded bg-white/10 px-2 py-1 placeholder-white/50"
                    />
                )}
                
                {tipoEjecucion === EXECUTION_TYPES.TIEMPO && (
                    <input
                        value={serie.duracion_segundos ? Math.round(serie.duracion_segundos / 60) || '' : ''}
                        onChange={(e) => {
                            // Convertir de minutos a segundos
                            const minutos = parseInt(e.target.value) || 0;
                            onChange(index, { ...serie, duracion_segundos: minutos * 60 });
                        }}
                        placeholder="Minutos"
                        type="number"
                        className="rounded bg-blue-900/20 border border-blue-600/30 px-2 py-1 placeholder-blue-300/50 text-blue-100"
                    />
                )}
                
                {tipoEjecucion === EXECUTION_TYPES.FALLO && (
                    <div className="flex items-center justify-center bg-orange-900/20 border border-orange-600/30 rounded px-2 py-1">
                        <span className="text-xs text-orange-300 font-medium">🔥 Al Fallo</span>
                    </div>
                )}
                
                {/* Peso - siempre presente */}
                <input
                    value={serie.carga_sugerida || ''}
                    onChange={(e) => onChange(index, { ...serie, carga_sugerida: e.target.value })}
                    placeholder="Peso"
                    className="rounded bg-white/10 px-2 py-1 placeholder-white/50"
                />
                
                {/* Pausa */}
                <input
                    value={serie.pausa || ''}
                    onChange={(e) => onChange(index, { ...serie, pausa: e.target.value })}
                    placeholder="Pausa"
                    type="number"
                    className="rounded bg-white/10 px-2 py-1 placeholder-white/50"
                />
                
                {/* Número de serie */}
                <span className="text-xs text-white/50 self-center text-center">
                    Serie {index + 1}
                </span>
            </div>
        </div>
    );
};

export default SeriesInput;



