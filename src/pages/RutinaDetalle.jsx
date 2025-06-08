import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaArrowLeft } from 'react-icons/fa';

const RutinaDetalle = () => {
    const { id } = useParams();
    const [rutina, setRutina] = useState(null);
    const [ejercicios, setEjercicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRutinaConEjercicios = async () => {
            const { data: rutinaData } = await supabase
                .from('rutinas')
                .select('*')
                .eq('id', id)
                .single();

            setRutina(rutinaData);

            const { data: ejerciciosData } = await supabase
                .from('rutinas_ejercicios')
                .select('orden, ejercicios (id, nombre, descripcion, video_url)')
                .eq('rutina_id', id)
                .order('orden', { ascending: true });

            const formateados = ejerciciosData?.map((e) => e.ejercicios) || [];
            setEjercicios(formateados);
            setLoading(false);
        };

        if (id) fetchRutinaConEjercicios();
    }, [id]);

    // Helper para convertir URL de YouTube en embed
    const getYouTubeEmbedUrl = (url) => {
        const videoIdMatch = url?.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&\n]+)/);
        return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 max-w-3xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-sm text-blue-600 mb-4 hover:underline"
            >
                <FaArrowLeft className="mr-2" />
                Volver
            </button>

            {loading ? (
                <p>Cargando rutina...</p>
            ) : rutina ? (
                <div className="bg-white p-6 rounded-xl shadow space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-700">{rutina.nombre}</h1>
                        <p className="text-gray-700 mt-2">{rutina.descripcion}</p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800">Ejercicios</h2>
                        {ejercicios.length === 0 ? (
                            <p className="text-gray-500">No hay ejercicios asignados a esta rutina.</p>
                        ) : (
                            ejercicios.map((ej, idx) => {
                                const embedUrl = getYouTubeEmbedUrl(ej.video_url);
                                return (
                                    <div key={ej.id} className="border-b pb-6 space-y-2">
                                        <h3 className="font-semibold">{idx + 1}. {ej.nombre}</h3>
                                        <p className="text-sm text-gray-700">{ej.descripcion}</p>
                                        {embedUrl ? (
                                            <div className="aspect-video">
                                                <iframe
                                                    width="100%"
                                                    height="315"
                                                    src={embedUrl}
                                                    title={ej.nombre}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-red-500">Video no válido</p>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : (
                <p>No se encontró la rutina.</p>
            )}
        </div>
    );
};

export default RutinaDetalle;
