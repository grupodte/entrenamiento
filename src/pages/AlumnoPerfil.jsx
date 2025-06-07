// src/pages/AlumnoPerfil.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaArrowLeft } from 'react-icons/fa';

const AlumnoPerfil = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [alumno, setAlumno] = useState(null);
    const [rutinas, setRutinas] = useState([]);
    const [asignada, setAsignada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            // Obtener perfil del alumno
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('nombre, apellido, email')
                .eq('id', id)
                .single();
            setAlumno(perfil);

            // Obtener todas las rutinas
            const { data: rutinasDisponibles } = await supabase
                .from('rutinas')
                .select('*');
            setRutinas(rutinasDisponibles || []);

            // Obtener la última rutina asignada
            const { data: asignaciones } = await supabase
                .from('asignaciones')
                .select('id, rutina_id')
                .eq('alumno_id', id)
                .order('fecha_asignacion', { ascending: false })
                .limit(1);

            if (asignaciones?.length > 0) {
                setAsignada(asignaciones[0].rutina_id);
            }

            setLoading(false);
        };

        fetchData();
    }, [id]);

    const handleAsignar = async (rutinaId) => {
        const { error } = await supabase.from('asignaciones').insert([
            {
                alumno_id: id,
                rutina_id: rutinaId,
            },
        ]);

        if (error) {
            setMensaje('❌ Error al asignar rutina');
        } else {
            setAsignada(rutinaId);
            setMensaje('✅ Rutina asignada correctamente');
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow text-center">
                <p>Cargando datos del alumno...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow">
            {/* Botón de regreso */}
            <button
                onClick={() => navigate('/admin')}
                className="flex items-center text-blue-600 hover:underline mb-6"
            >
                <FaArrowLeft className="mr-2" />
                Volver al Panel del Entrenador
            </button>

            {/* Info del alumno */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Perfil de {alumno?.nombre} {alumno?.apellido}</h1>
                <p className="text-gray-600 text-sm">{alumno?.email}</p>
            </div>

            {/* Rutinas disponibles */}
            <h2 className="text-lg font-semibold mb-4">Rutinas disponibles:</h2>
            <ul className="space-y-4">
                {rutinas.map((rutina) => (
                    <li
                        key={rutina.id}
                        className={`p-4 border rounded-lg ${asignada === rutina.id ? 'bg-green-100' : 'bg-gray-50'}`}
                    >
                        <h3 className="font-bold">{rutina.nombre}</h3>
                        <p className="text-sm text-gray-600 mb-2">{rutina.descripcion}</p>
                        {rutina.video_url && (
                            <a
                                href={rutina.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 text-sm underline"
                            >
                                Ver video
                            </a>
                        )}
                        <div className="mt-2">
                            <button
                                onClick={() => handleAsignar(rutina.id)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                disabled={asignada === rutina.id}
                            >
                                {asignada === rutina.id ? 'Asignada' : 'Asignar esta rutina'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Mensaje de feedback */}
            {mensaje && <p className="mt-4 text-green-600 font-medium">{mensaje}</p>}
        </div>
    );
};

export default AlumnoPerfil;
