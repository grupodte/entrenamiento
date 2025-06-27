import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import RutinaForm from '../../components/Rutina/RutinaForm';
import AdminLayout from '../../layouts/AdminLayout';
import BrandedLoader from '../../components/BrandedLoader';
import { FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const EditarRutina = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rutinaParaEditar, setRutinaParaEditar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRutina = async () => {
            try {
                setLoading(true);

                // 1. Obtener rutina base
                const { data: rutina, error: errorRutina } = await supabase
                    .from('rutinas_base')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (errorRutina) throw errorRutina;

                // 2. Obtener bloques de esa rutina
                const { data: bloques, error: errorBloques } = await supabase
                    .from('bloques')
                    .select('*')
                    .eq('rutina_base_id', id)
                    .order('orden', { ascending: true });

                if (errorBloques) throw errorBloques;

                if (!bloques.length) {
                    setRutinaParaEditar({ ...rutina, bloques: [] });
                    return;
                }

                // 3. Obtener subbloques
                const { data: subbloques, error: errorSubbloques } = await supabase
                    .from('subbloques')
                    .select('*')
                    .in('bloque_id', bloques.map(b => b.id));

                if (errorSubbloques) throw errorSubbloques;

                // 4. Obtener subbloques_ejercicios
                const { data: subEjercicios, error: errorSubEj } = await supabase
                    .from('subbloques_ejercicios')
                    .select(`
                        *,
                        ejercicio: ejercicios (id, nombre)
                    `)
                    .in('subbloque_id', subbloques.map(sb => sb.id));

                if (errorSubEj) throw errorSubEj;

                // 5. Obtener series_subejercicio
                const { data: seriesRaw, error: errorSeries } = await supabase
                    .from('series_subejercicio')
                    .select('*')
                    .in('subbloque_ejercicio_id', subEjercicios.map(se => se.id));

                if (errorSeries) throw errorSeries;

                // Agrupar series en ejercicios
                const subEjerciciosAgrupados = subEjercicios.map(ej => ({
                    id: ej.id,
                    subbloque_id: ej.subbloque_id,
                    ejercicio_id: ej.ejercicio_id,
                    nombre: ej.ejercicio?.nombre || '',
                    orden: ej.orden,
                    ejercicioData: ej.ejercicio,
                    series: (seriesRaw || [])
                        .filter(s => s.subbloque_ejercicio_id === ej.id)
                        .map(s => ({
                            reps: s.reps || '',
                            carga: s.carga_sugerida || '',
                            pausa: s.pausa || ''
                        }))
                }));

                // Agrupar subbloques
                const subbloquesAgrupados = subbloques.map(sb => {
                    const ejercicios = subEjerciciosAgrupados
                        .filter(ej => ej.subbloque_id === sb.id)
                        .sort((a, b) => a.orden - b.orden);

                    const shared_config = sb.tipo !== 'simple'
                        ? {
                            num_sets: Math.max(...(ejercicios.map(e => e.series.length || 0))),
                            shared_rest: sb.shared_rest || ''
                        }
                        : undefined;

                    return {
                        ...sb,
                        ejercicios,
                        shared_config
                    };
                });

                // Agrupar bloques
                const bloquesFinal = bloques.map(b => ({
                    ...b,
                    subbloques: subbloquesAgrupados.filter(sb => sb.bloque_id === b.id)
                }));

                // Estructura final para RutinaForm
                const rutinaTransformada = {
                    ...rutina,
                    bloques: bloquesFinal
                };

                setRutinaParaEditar(rutinaTransformada);

            } catch (err) {
                console.error("Error al cargar rutina:", err.message);
                toast.error("No se pudo cargar la rutina: " + err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRutina();
    }, [id]);

    const handleGuardarEditar = (rutinaActualizada) => {
        navigate(`/admin/rutinas`);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center min-h-screen">
                    <BrandedLoader />
                </div>
            </AdminLayout>
        );
    }

    if (error || !rutinaParaEditar) {
        return (
            <AdminLayout>
                <div className="p-4 text-center text-red-500">
                    <p>{error || 'No se encontró la rutina para editar.'}</p>
                    <button
                        onClick={() => navigate('/admin/rutinas')}
                        className="mt-4 bg-skyblue text-white px-4 py-2 rounded hover:bg-white/20 transition"
                    >
                        Volver a Rutinas
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="w-full min-h-screen flex flex-col bg-neutral-900 text-white">
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
                            modo="editar"
                            rutinaInicial={rutinaParaEditar}
                            onGuardar={handleGuardarEditar}
                        />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default EditarRutina;
