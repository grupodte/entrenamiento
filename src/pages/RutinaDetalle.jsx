// src/pages/RutinaDetalle.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaArrowLeft } from 'react-icons/fa';
import YouTubeEmbed from '../components/YouTubeEmbed'; // 1. IMPORTAMOS EL NUEVO COMPONENTE

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const RutinaDetalle = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams(); // Para leer el "?tipo=..." de la URL
    const navigate = useNavigate();

    const [ejercicios, setEjercicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nombreRutina, setNombreRutina] = useState('Rutina Detallada');

    useEffect(() => {
        if (!id) return;

        const fetchRutinaConEjercicios = async () => {
            const tipo = searchParams.get('tipo'); // Obtenemos 'base' o 'personalizada'
            let query;

            // 2. LÓGICA MEJORADA: Decide qué tabla consultar según el tipo
            if (tipo === 'base') {
                query = supabase
                    .from('rutinas_base_ejercicios')
                    .select('orden, series, reps, pausa, carga:carga_sugerida, ejercicios(nombre, descripcion, video_url)')
                    .eq('rutina_base_id', id)
                    .order('orden', { ascending: true });
            } else { // Asumimos 'personalizada' por defecto
                query = supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .select('dia_semana, orden, series, reps, pausa, carga, ejercicios(nombre, descripcion, video_url)')
                    .eq('rutina_personalizada_id', id)
                    .order('orden', { ascending: true });
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error cargando ejercicios:', error);
                setLoading(false);
                return;
            }

            setEjercicios(data || []);
            setLoading(false);
        };

        fetchRutinaConEjercicios();
    }, [id, searchParams]);

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-blue-600 hover:underline">
                <FaArrowLeft className="mr-2" />
                Volver atrás
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">{nombreRutina}</h1>

            {loading ? (
                <p className="text-center">Cargando ejercicios...</p>
            ) : ejercicios.length === 0 ? (
                <p className="text-center text-gray-500">No se encontraron ejercicios para esta rutina.</p>
            ) : (
                <div className="space-y-4">
                    {ejercicios.map((e, i) => (
                        <div key={i} className="border p-4 rounded-lg bg-white shadow-sm">
                            <h3 className="font-bold text-lg text-gray-800">{e.ejercicios?.nombre}</h3>
                            {e.ejercicios?.descripcion && <p className="text-sm text-gray-600 my-2">{e.ejercicios.descripcion}</p>}

                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                <span className="font-semibold">{e.series}</span> series x <span className="font-semibold">{e.reps}</span> reps | Pausa: <span className="font-semibold">{e.pausa}s</span>
                                {e.carga && <> | Carga: <span className="font-semibold">{e.carga}</span></>}
                            </p>

                            {/* 3. REEMPLAZAMOS EL <video> POR NUESTRO COMPONENTE */}
                            {e.ejercicios?.video_url ? (
                                <YouTubeEmbed url={e.ejercicios.video_url} title={e.ejercicios.nombre} />
                            ) : (
                                <p className="text-xs text-gray-500 italic mt-2">Sin video disponible</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RutinaDetalle;