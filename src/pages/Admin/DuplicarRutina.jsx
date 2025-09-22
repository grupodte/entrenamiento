import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import RutinaForm from '../../components/Rutina/RutinaForm';
import { normalizarSerie } from '../../constants/executionTypes';

import { FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DuplicarRutina = () => {
    const { id: rutinaIdFromParams } = useParams(); // ID de la rutina a duplicar
    const navigate = useNavigate();
    const location = useLocation();

    const [rutinaParaDuplicar, setRutinaParaDuplicar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRutina = async () => {
            try {
                setLoading(true);
                setError(null);

                const rutinaId = rutinaIdFromParams;
                
                // Cargar rutina base para duplicar
                const { data: rutinaData, error: errorRutina } = await supabase
                    .from('rutinas_base')
                    .select('*')
                    .eq('id', rutinaId)
                    .single();

                if (errorRutina || !rutinaData) {
                    throw new Error(`No se encontró la rutina para duplicar`);
                }

                const { data: bloques, error: errorBloques } = await supabase
                    .from('bloques')
                    .select('*')
                    .eq('rutina_base_id', rutinaId)
                    .order('orden', { ascending: true });

                if (errorBloques) throw errorBloques;

                let subbloques = [];
                let subEjercicios = [];
                let seriesRaw = [];

                if (bloques.length > 0) {
                    const { data: subbloquesData, error: errorSubbloques } = await supabase
                        .from('subbloques')
                        .select('*')
                        .in('bloque_id', bloques.map(b => b.id))
                        .order('orden', { ascending: true });
                    if (errorSubbloques) throw errorSubbloques;
                    subbloques = subbloquesData || [];

                    const { data: subEjerciciosData, error: errorSubEj } = await supabase
                        .from('subbloques_ejercicios')
                        .select('*, ejercicio: ejercicios (id, nombre)')
                        .in('subbloque_id', subbloques.map(sb => sb.id))
                        .order('orden', { ascending: true });
                    if (errorSubEj) throw errorSubEj;
                    subEjercicios = subEjerciciosData || [];

                const { data: seriesRawData, error: errorSeries } = await supabase
                    .from('series_subejercicio')
                    .select('id, subbloque_ejercicio_id, nro_set, reps, carga_sugerida, pausa, nota, tipo_ejecucion, duracion_segundos, unidad_tiempo')
                    .in('subbloque_ejercicio_id', subEjercicios.map(se => se.id))
                    .order('nro_set', { ascending: true });
                    
                    if (errorSeries) throw errorSeries;
                    seriesRaw = seriesRawData || [];
                }

                const subEjerciciosAgrupados = subEjercicios.map(ej => ({
                    ...ej,
                    nombre: ej.ejercicio?.nombre || 'Ejercicio no encontrado',
                    series: (() => {
                        const seriesFiltradas = seriesRaw.filter(s => s.subbloque_ejercicio_id === ej.id);
                        const seriesNormalizadas = seriesFiltradas.map(s => normalizarSerie(s));
                        return seriesNormalizadas;
                    })()
                }));

                const subbloquesAgrupados = subbloques.map(sb => {
                    const ejerciciosDeSubbloque = subEjerciciosAgrupados.filter(ej => ej.subbloque_id === sb.id);
                    let sharedConfig = sb.shared_config;

                    if (sb.tipo === 'superset' && !sharedConfig) {
                        const primerEjercicio = ejerciciosDeSubbloque[0];
                        sharedConfig = {
                            num_sets: primerEjercicio?.series?.length || 1,
                            shared_rest: primerEjercicio?.series?.[0]?.pausa || ''
                        };
                    }

                    return {
                        ...sb,
                        ejercicios: ejerciciosDeSubbloque,
                        shared_config: sharedConfig
                    };
                });

                const bloquesFinal = bloques.map(b => ({
                    ...b,
                    subbloques: subbloquesAgrupados.filter(sb => sb.bloque_id === b.id)
                }));

                // Modificar el nombre para indicar que es una copia
                const rutinaFinal = {
                    ...rutinaData,
                    nombre: `Copia de ${rutinaData.nombre}`, // Agregar prefijo "Copia de"
                    bloques: bloquesFinal,
                    // Limpiar el ID para que se trate como nueva rutina
                    id: null
                };
                
                setRutinaParaDuplicar(rutinaFinal);

            } catch (err) {
                console.error("Error al cargar rutina para duplicación:", err.message, err);
                toast.error(`No se pudo cargar la rutina: ${err.message}`);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (rutinaIdFromParams) fetchRutina();
    }, [rutinaIdFromParams]);
    

    const handleGuardarDuplicar = (rutinaNuevaConId) => {
        // Esta función es llamada por RutinaForm con la nueva rutina guardada y su ID.
        toast.success("Sesión duplicada correctamente.");
        navigate('/admin/rutinas'); // Volver a la lista de rutinas base
    };

    if (loading) {
        return (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-white">Cargando datos para duplicar...</div>
                </div>
        );
    }

    if (error || !rutinaParaDuplicar) {
        return (
                <div className="p-4 text-center text-red-500">
                    <p>{error || 'No se encontró la rutina para duplicar.'}</p>
                    <button
                        onClick={() => navigate('/admin/rutinas')}
                        className="mt-4 bg-skyblue text-white px-4 py-2 rounded hover:bg-white/20 transition"
                    >
                        Volver a Rutinas
                    </button>
                </div>
        );
    }

    return (
        <div className="w-full min-h-[calc(100dvh-4rem)] pb-[90px] flex flex-col text-white">
  <div className="p-4 md:p-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-skyblue hover:text-white transition mb-4 text-sm"
                    >
                        <FaArrowLeft /> Volver
                    </button>
                    <h1 className="text-2xl font-bold text-white mb-1">Duplicar Sesión</h1>
                    <p className="text-sm text-white/70 mb-2">Creando una copia de la sesión "{rutinaParaDuplicar?.nombre?.replace('Copia de ', '') || 'Sin nombre'}".</p>
                    <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg mb-4">
                        <p className="text-sm text-blue-200">
                            ℹ️ Estás duplicando una sesión existente. Se creará una nueva sesión con estos datos que podrás modificar antes de guardar.
                        </p>
                    </div>
                </div>

                <div className="px-4 md:px-6 mx-auto w-full flex flex-col h-full overflow-hidden">
                    <div className="overscroll-contain">
                        <RutinaForm
                            modo="crear" // Usar modo "crear" ya que vamos a crear una nueva rutina
                            rutinaInicial={rutinaParaDuplicar} // Pasar los datos cargados como inicial
                            onGuardar={handleGuardarDuplicar} // Callback para después del guardado exitoso
                            tipoEntidadOriginal="base" // Indicar que trabajamos con rutinas base
                            isDuplicating={true} // Flag para indicar que estamos duplicando
                        />
                    </div>
                </div>
            </div>
    );
};

export default DuplicarRutina;
