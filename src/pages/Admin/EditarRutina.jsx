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
                        *,
                        rutina_bloques (
                            *,
                            rutina_sub_bloques (
                                *,
                                rutina_ejercicios (
                                    *,
                                    ejercicios (*)
                                )
                            )
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;

                // Transformar los datos para que coincidan con la estructura esperada por RutinaForm
                // Esto es crucial y dependerá de cómo RutinaForm espera los datos.
                // Por ejemplo, si RutinaForm espera `ejercicio_id` en lugar de un objeto `ejercicios`.
                const transformada = {
                    ...data,
                    bloques: data.rutina_bloques.map(bloque => ({
                        ...bloque,
                        id: bloque.id, // Asegurar que el ID del bloque se mantenga
                        nombre_bloque: bloque.nombre_bloque,
                        descripcion_bloque: bloque.descripcion_bloque,
                        sub_bloques: bloque.rutina_sub_bloques.map(subBloque => ({
                            ...subBloque,
                            id: subBloque.id, // Asegurar que el ID del sub_bloque se mantenga
                            tipo: subBloque.tipo,
                            ejercicios: subBloque.rutina_ejercicios.map(ej => ({
                                ...ej,
                                id: ej.id, // Asegurar que el ID del rutina_ejercicio se mantenga
                                ejercicio_id: ej.ejercicio_id,
                                // Asegurarse de que 'series' sea un array de strings/numbers si es necesario
                                series: typeof ej.series === 'string' ? ej.series.split(',').map(s => s.trim()) : ej.series,
                                // ... otros campos como repeticiones, rir, etc.
                                // El objeto 'ejercicios' (info del catálogo) se puede pasar si RutinaForm lo usa
                                // o solo el ID como 'ejercicio_id'.
                                ejercicioData: ej.ejercicios // Datos completos del ejercicio desde la tabla 'ejercicios'
                            })).sort((a, b) => a.orden - b.orden) // Ordenar ejercicios
                        })).sort((a, b) => a.orden - b.orden) // Ordenar sub_bloques
                    })).sort((a, b) => a.orden - b.orden) // Ordenar bloques
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
