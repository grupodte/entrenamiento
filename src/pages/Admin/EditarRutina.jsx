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
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from('rutinas_base')
                    .select(`
                        id, nombre, tipo, descripcion, created_at, user_id,
                        bloques:rutina_bloques (
                            id, orden, nombre_bloque, descripcion_bloque, rutina_base_id,
                            sub_bloques:rutina_sub_bloques (
                                id, orden, tipo, bloque_id,
                                ejercicios:rutina_ejercicios (
                                    id, orden, ejercicio_id, series, repeticiones, rir, tiempo_descanso_segundos, notas, sub_bloque_id,
                                    ejercicio_detalle:ejercicios (id, nombre, tipo_ejercicio, video_url, grupo_muscular)
                                )
                            )
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;

                // Transformar los datos para que coincidan con la estructura esperada por RutinaForm
                // Esto es crucial y dependerá de cómo RutinaForm espera los datos.
                if (!data) {
                    throw new Error("No se encontró la rutina o no hay datos.");
                }

                const transformada = {
                    ...data, // Contiene id, nombre, tipo, descripcion de rutinas_base
                    // Los bloques ya vienen anidados y aliaseados desde la consulta
                    // Solo necesitamos asegurar que la estructura interna coincida con lo que RutinaForm espera.
                    bloques: (data.bloques || []).map(bloque => ({
                        ...bloque, // id, orden, nombre_bloque, descripcion_bloque de rutina_bloques
                        // 'sub_bloques' ya está aliaseado en la consulta
                        sub_bloques: (bloque.sub_bloques || []).map(subBloque => ({
                            ...subBloque, // id, orden, tipo de rutina_sub_bloques
                            // 'ejercicios' ya está aliaseado en la consulta
                            ejercicios: (subBloque.ejercicios || []).map(ej => ({
                                ...ej, // id, orden, ejercicio_id, series, etc. de rutina_ejercicios
                                // 'ejercicioData' es el alias para los datos de la tabla 'ejercicios'
                                ejercicioData: ej.ejercicio_detalle
                            })).sort((a, b) => a.orden - b.orden)
                        })).sort((a, b) => a.orden - b.orden)
                    })).sort((a, b) => a.orden - b.orden)
                };
                setRutinaParaEditar(transformada);

            } catch (err) {
                console.error("Error cargando rutina para editar:", err);
                setError("No se pudo cargar la rutina para editar. " + err.message);
                toast.error("Error al cargar la rutina: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchRutina();
        } else {
            navigate('/admin/rutinas'); // Si no hay ID, redirigir
        }
    }, [id, navigate]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center min-h-screen">
                    <BrandedLoader />
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="p-4 text-center text-red-500">
                    <p>{error}</p>
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

    if (!rutinaParaEditar && !loading) {
        return (
            <AdminLayout>
                <div className="p-4 text-center text-white">
                    <p>No se encontró la rutina para editar o ya no existe.</p>
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
                        onClick={() => navigate(-1)} // O a /admin/rutinas
                        className="flex items-center gap-2 text-skyblue hover:text-white transition mb-4 text-sm"
                    >
                        <FaArrowLeft /> Volver
                    </button>
                    <h1 className="text-2xl font-bold text-white mb-1">Editar Rutina</h1>
                    <p className="text-sm text-white/70 mb-6">Modifica los detalles de la rutina "{rutinaParaEditar?.nombre}".</p>
                </div>

                <div className="px-4 md:px-6 mx-auto w-full flex flex-col h-full overflow-hidden ">
                    <div className="overscroll-contain">
                        {rutinaParaEditar && <RutinaForm rutinaAEditar={rutinaParaEditar} />}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default EditarRutina;
