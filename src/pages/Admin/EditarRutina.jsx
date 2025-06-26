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
                const { data, error: fetchError } = await supabase
                    .from('rutinas_base')
                    .select(`
                        id, nombre, descripcion,
                        bloques (
                            id, orden, tipo,
                            subbloques (
                                id, orden, nombre, tipo,
                                subbloques_ejercicios (
                                    id, orden, ejercicio_id,
                                    ejercicio: ejercicios ( id, nombre ),
                                    series: series_subejercicio (
                                        id, nro_set, reps, pausa, carga_sugerida
                                    )
                                )
                            )
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error("No se encontró la rutina.");

                // Transformar la estructura para que sea compatible con RutinaForm
                const transformada = {
                    ...data,
                    bloques: data.bloques?.map(bloque => ({
                        ...bloque,
                        sub_bloques: bloque.subbloques?.map(sb => ({
                            ...sb,
                            ejercicios: sb.subbloques_ejercicios?.map(se => ({
                                ...se,
                                ejercicioData: se.ejercicio,
                                sets_config: se.series?.map(serie => ({
                                    id: serie.id,
                                    nro_set: serie.nro_set,
                                    reps: serie.reps,
                                    pausa: serie.pausa,
                                    carga: serie.carga_sugerida
                                })) || []
                            })) || []
                        })) || []
                    })) || []
                };

                setRutinaParaEditar(transformada);
            } catch (err) {
                console.error("Error al cargar rutina:", err);
                toast.error("No se pudo cargar la rutina.");
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRutina();
    }, [id]);

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

                <div className="px-4 md:px-6 mx-auto w-full flex flex-col h-full overflow-hidden ">
                    <div className="overscroll-contain">
                        <RutinaForm rutinaAEditar={rutinaParaEditar} modoEdicion />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default EditarRutina;
