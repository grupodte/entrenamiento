import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../layouts/AdminLayout';
import { FaArrowLeft, FaClipboardList, FaSpinner } from 'react-icons/fa';
import BrandedLoader from '../../components/BrandedLoader'; // Asumiendo que existe este componente

const VerRutina = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRutinaDetalle = async () => {
            setLoading(true);
            try {
                // Primero, obtener la rutina base
                const { data: rutinaData, error: rutinaError } = await supabase
                    .from('rutinas_base')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (rutinaError) throw rutinaError;
                if (!rutinaData) throw new Error('Rutina no encontrada');

                // Luego, obtener los bloques y ejercicios asociados
                // Esto asume una estructura donde los bloques tienen una referencia a rutina_base_id
                // y los ejercicios dentro de los bloques.
                // Ajustar según la estructura real de la base de datos.
                const { data: bloquesData, error: bloquesError } = await supabase
                    .from('rutina_bloques') // Tabla principal para esta consulta específica
                    .select(`
            id, orden, nombre_bloque, descripcion_bloque,
            sub_bloques:rutina_sub_bloques (
              id, orden, tipo,
              ejercicios:rutina_ejercicios (
                id, orden, ejercicio_id, series, repeticiones, rir, tiempo_descanso_segundos, notas,
                ejercicio_detalle:ejercicios (nombre, video_url, tipo_ejercicio)
              )
            )
          `)
                    .eq('rutina_base_id', id) // Filtrar por el ID de la rutina base
                    .order('orden', { ascending: true }) // Ordenar bloques
                    .order('orden', { foreignTable: 'rutina_sub_bloques', ascending: true }) // Ordenar sub_bloques
                    .order('orden', { foreignTable: 'rutina_sub_bloques.rutina_ejercicios', ascending: true }); // Ordenar ejercicios

                if (bloquesError) throw bloquesError;

                // La data ya debería estar ordenada por Supabase.
                // La transformación es para asegurar la estructura esperada en el renderizado.
                const bloquesProcesados = (bloquesData || []).map(bloque => ({
                    ...bloque,
                    rutina_sub_bloques: (bloque.sub_bloques || []).map(subBloque => ({ // Usar el alias 'sub_bloques'
                        ...subBloque,
                        rutina_ejercicios: (subBloque.ejercicios || []).map(ej => ({ // Usar el alias 'ejercicios'
                            ...ej,
                            ejercicios: ej.ejercicio_detalle // Asignar los detalles del ejercicio al campo esperado
                        }))
                    }))
                }));

                setRutina({ ...rutinaData, bloques: bloquesProcesados });
            } catch (err) {
                console.error("Error cargando detalles de la rutina:", err);
                setError(err.message);
                setRutina(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchRutinaDetalle();
        }
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

    if (error) {
        return (
            <AdminLayout>
                <div className="p-4 text-center text-red-500">
                    <p>Error: {error}</p>
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

    if (!rutina) {
        return (
            <AdminLayout>
                <div className="p-4 text-center text-white">
                    <p>No se encontró la rutina.</p>
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
            <div className="p-4 md:p-8 text-white w-full max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-skyblue hover:text-white transition mb-6 text-sm"
                >
                    <FaArrowLeft /> Volver
                </button>

                <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                                <FaClipboardList /> {rutina.nombre}
                            </h1>
                            <p className="text-sm text-white/70 italic">{rutina.tipo || 'Tipo no especificado'}</p>
                        </div>
                        {/* <button
              onClick={() => navigate(`/admin/rutinas/editar/${rutina.id}`)}
              className="bg-yellow-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-sm"
            >
              Editar Rutina
            </button> */}
                    </div>

                    <p className="text-white/80 mb-6">{rutina.descripcion || 'Sin descripción.'}</p>

                    <h2 className="text-xl font-semibold text-skyblue mb-4 border-b border-skyblue/50 pb-2">Estructura de la Rutina</h2>

                    {rutina.bloques && rutina.bloques.length > 0 ? (
                        rutina.bloques.map((bloque, bloqueIndex) => (
                            <div key={bloque.id || bloqueIndex} className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-1">
                                    Bloque {bloque.orden}: {bloque.nombre_bloque || `Bloque ${String.fromCharCode(65 + bloqueIndex)}`}
                                </h3>
                                {bloque.descripcion_bloque && <p className="text-sm text-white/70 italic mb-3">{bloque.descripcion_bloque}</p>}

                                {bloque.rutina_sub_bloques && bloque.rutina_sub_bloques.map((subBloque, subBloqueIndex) => (
                                    <div key={subBloque.id || subBloqueIndex} className="mb-4 pl-4 border-l-2 border-skyblue/50">
                                        <h4 className="text-md font-semibold text-skyblue">
                                            {subBloque.tipo === 'SUPERSET' ? 'Superset' : subBloque.tipo === 'TRISET' ? 'Triset' : `Sub-bloque ${subBloque.orden}`}
                                        </h4>
                                        {subBloque.rutina_ejercicios && subBloque.rutina_ejercicios.map((ej, ejIndex) => (
                                            <div key={ej.id || ejIndex} className="py-2">
                                                <p className="font-medium text-white">
                                                    {ej.ejercicios?.nombre || `Ejercicio ${ej.ejercicio_id}`}
                                                    {ej.ejercicios?.tipo_ejercicio && <span className="text-xs bg-gray-600 px-1.5 py-0.5 rounded ml-2">{ej.ejercicios.tipo_ejercicio}</span>}
                                                </p>
                                                <ul className="list-disc list-inside pl-4 text-sm text-white/80">
                                                    {ej.series && <li>Series: {typeof ej.series === 'string' ? ej.series : JSON.stringify(ej.series)}</li>}
                                                    {ej.repeticiones && <li>Repeticiones: {ej.repeticiones}</li>}
                                                    {ej.rir && <li>RIR: {ej.rir}</li>}
                                                    {ej.tiempo_descanso_segundos && <li>Descanso: {ej.tiempo_descanso_segundos}s</li>}
                                                    {ej.notas && <li className="italic">Notas: {ej.notas}</li>}
                                                </ul>
                                                {ej.ejercicios?.video_url && (
                                                    <a
                                                        href={ej.ejercicios.video_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-skyblue text-xs underline hover:text-white transition ml-4"
                                                    >
                                                        Ver video
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p className="text-white/70">Esta rutina aún no tiene ejercicios asignados.</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default VerRutina;
