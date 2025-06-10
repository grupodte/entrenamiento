// src/pages/RutinaDetalle.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const RutinaDetalle = () => {
    const { id } = useParams(); // rutina_personalizada_id
    const navigate = useNavigate();
    const { user } = useAuth();

    const [ejerciciosPorDia, setEjerciciosPorDia] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchRutinaConEjercicios = async () => {
            const { data, error } = await supabase
                .from('rutinas_personalizadas_ejercicios')
                .select('dia_semana, orden, series, reps, pausa, carga, ejercicios(nombre, descripcion, video_url)')
                .eq('rutina_personalizada_id', id)
                .order('dia_semana, orden', { ascending: true });

            if (error) {
                console.error('Error cargando ejercicios:', error);
                return;
            }

            // Agrupar por día de la semana
            const agrupado = {};
            data.forEach((e) => {
                if (!agrupado[e.dia_semana]) agrupado[e.dia_semana] = [];
                agrupado[e.dia_semana].push(e);
            });

            setEjerciciosPorDia(agrupado);
            setLoading(false);
        };

        fetchRutinaConEjercicios();
    }, [id]);

    return (
        <div className="max-w-3xl mx-auto p-6">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-blue-600 hover:underline">
                <FaArrowLeft className="mr-2" />
                Volver atrás
            </button>

            <h1 className="text-2xl font-bold mb-4">Rutina detallada</h1>

            {loading ? (
                <p>Cargando ejercicios...</p>
            ) : (
                Object.entries(ejerciciosPorDia).map(([dia, ejercicios]) => (
                    <div key={dia} className="mb-6">
                        <h2 className="text-xl font-semibold mb-2 text-blue-700">{diasSemana[dia]}</h2>
                        <ul className="space-y-3">
                            {ejercicios.map((e, i) => (
                                <li key={i} className="border p-3 rounded bg-white shadow-sm">
                                    <h3 className="font-bold text-gray-800">{e.ejercicios?.nombre}</h3>
                                    <p className="text-sm text-gray-600">{e.ejercicios?.descripcion}</p>
                                    <div className="text-sm mt-1 text-gray-700">
                                        <p>Series: {e.series}, Reps: {e.reps}, Pausa: {e.pausa}s</p>
                                        {e.carga && <p>Carga: {e.carga}</p>}
                                        {e.ejercicios?.video_url && (
                                            <video controls className="mt-2 w-full max-w-md rounded">
                                                <source src={e.ejercicios.video_url} type="video/mp4" />
                                                Tu navegador no soporta video.
                                            </video>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            )}
        </div>
    );
};

export default RutinaDetalle;
