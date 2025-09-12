import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Añadir useLocation
import { supabase } from '../../lib/supabaseClient';
import RutinaForm from '../../components/Rutina/RutinaForm';
import AdminLayout from '../../layouts/AdminLayout';
import { normalizarSerie } from '../../constants/executionTypes';

import { FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const EditarRutina = () => {
    const { id: rutinaIdFromParams } = useParams(); // ID de la rutina (base o personalizada)
    const navigate = useNavigate();
    const location = useLocation();

    const [rutinaParaEditar, setRutinaParaEditar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Leer parámetros de la URL para el modo "personalizar"

    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
        const alumnoIdParaPersonalizar = queryParams.get('alumnoId');
    const asignacionIdParaPersonalizar = queryParams.get('asignacionId');
    const esModoPersonalizar = queryParams.get('modo') === 'personalizar';
    // tipoOriginal indicará si la rutina que se carga es 'base' o 'personalizada'
    // Si es modoPersonalizar, el 'id' de useParams es de una rutina_base.
    // Si no es modoPersonalizar, el 'id' puede ser de rutina_base o rutina_personalizada.
    // Necesitamos una forma de saber qué tipo de rutina estamos editando si no es modoPersonalizar.
    // Por ahora, asumiremos que si no es modoPersonalizar, la URL contendrá un tipo explícito o el ID es único.
    // Esta lógica de carga necesitará ser más robusta para diferenciar entre editar una base y una personalizada.
    // Para simplificar este paso, nos enfocaremos en que `modo=personalizar` cargue la base.
    // Y la edición normal de rutina base/personalizada (sin modo=personalizar) se asumirá que funciona como antes.

    const [tipoEntidad, setTipoEntidad] = useState('base'); // 'base' o 'personalizada'


    const tipoUrl = queryParams.get('tipo');

    useEffect(() => {
        const fetchRutina = async () => {
            try {
                setLoading(true);
                setError(null);

                const rutinaId = rutinaIdFromParams;
                let fromTable = 'rutinas_base';
                let bloquesJoinField = 'rutina_base_id';

                if (esModoPersonalizar) {
                    // Personalizar una rutina base
                    fromTable = 'rutinas_base';
                    bloquesJoinField = 'rutina_base_id';
                    setTipoEntidad('base');
                } else if (tipoUrl === 'personalizada') {
                    // Edición directa de una rutina personalizada
                    fromTable = 'rutinas_personalizadas';
                    bloquesJoinField = 'rutina_personalizada_id';
                    setTipoEntidad('personalizada');
                } else {
                    // Edición de rutina base (default)
                    fromTable = 'rutinas_base';
                    bloquesJoinField = 'rutina_base_id';
                    setTipoEntidad('base');
                }

                const { data: rutinaData, error: errorRutina } = await supabase
                    .from(fromTable)
                    .select('*')
                    .eq('id', rutinaId)
                    .single();

                if (errorRutina || !rutinaData) {
                    throw new Error(`No se encontró la rutina en ${fromTable}`);
                }

                const { data: bloques, error: errorBloques } = await supabase
                    .from('bloques')
                    .select('*')
                    .eq(bloquesJoinField, rutinaId)
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

                const rutinaFinal = {
                    ...rutinaData,
                    bloques: bloquesFinal
                };
                
                setRutinaParaEditar(rutinaFinal);

            } catch (err) {
                console.error("Error al cargar rutina para edición:", err.message, err);
                toast.error(`No se pudo cargar la rutina: ${err.message}`);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (rutinaIdFromParams) fetchRutina();
    }, [rutinaIdFromParams, tipoUrl, esModoPersonalizar]);
    

    const handleGuardarEditar = (rutinaActualizadaConId) => {
        // Esta función es llamada por RutinaForm con la rutina ya guardada/actualizada y su ID.
        // Si esModoPersonalizar, RutinaForm se encargará de la lógica de clonación y actualización de asignación.
        // Aquí solo navegamos.
        toast.success("Rutina procesada correctamente.");
        if (esModoPersonalizar && alumnoIdParaPersonalizar) {
            navigate(`/admin/alumno/${alumnoIdParaPersonalizar}`); // Volver al perfil del alumno
        } else if (tipoEntidad === 'base') {
            navigate('/admin/rutinas'); // Volver a la lista de rutinas base
        } else if (tipoEntidad === 'personalizada') {
            // Si se estaba editando una rutina personalizada, ¿a dónde ir?
            // Quizás al perfil del alumno si se tiene el ID, o a una lista de rutinas personalizadas.
            // Por ahora, a la lista de rutinas base como fallback.
            navigate('/admin/rutinas');
        } else {
            navigate(-1); // Volver a la página anterior como fallback
        }
    };

    if (loading) {
        return (
                <div className="flex justify-center items-center min-h-screen">
                    {/* Puedes agregar un esqueleto de carga aquí si lo deseas */}
                </div>
        );
    }

    if (error || !rutinaParaEditar) {
        return (
                <div className="p-4 text-center text-red-500">
                    <p>{error || 'No se encontró la rutina para editar.'}</p>
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
                    <h1 className="text-2xl font-bold text-white mb-1">Editar Rutina</h1>
                    <p className="text-sm text-white/70 mb-6">Modificá la rutina "{rutinaParaEditar?.nombre}".</p>
                </div>

                <div className="px-4 md:px-6 mx-auto w-full flex flex-col h-full overflow-hidden">
                    <div className="overscroll-contain">
                        <RutinaForm
                            modo="editar" // Siempre "editar" ya que cargamos datos existentes
                            rutinaInicial={rutinaParaEditar}
                            onGuardar={handleGuardarEditar} // Callback para después del guardado exitoso
                            // Nuevas props para el modo personalizar:
                            esModoPersonalizar={esModoPersonalizar}
                            alumnoIdParaPersonalizar={alumnoIdParaPersonalizar}
                            asignacionIdParaPersonalizar={asignacionIdParaPersonalizar}
                            idRutinaOriginal={esModoPersonalizar ? rutinaIdFromParams : null} // ID de la rutina_base original
                            // Prop para indicar el tipo de entidad que se está editando (si no es personalizar)
                            tipoEntidadOriginal={!esModoPersonalizar ? tipoEntidad : 'base'}
                        />
                    </div>
                </div>
            </div>
    );
};

export default EditarRutina;
