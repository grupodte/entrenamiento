// src/pages/Admin/AsignarRutina.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../layouts/AdminLayout';

const AsignarRutina = () => {
    const { id: alumnoId } = useParams();
    const [searchParams] = useSearchParams();
    const dia = parseInt(searchParams.get('dia'), 10);
    const navigate = useNavigate();

    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        const fetchRutinas = async () => {
            const { data, error } = await supabase.from('rutinas_base').select('*');
            if (!error) setRutinas(data);
            setLoading(false);
        };
        fetchRutinas();
    }, []);

    const handleAsignar = async (rutinaBaseId) => {
        try {
            setMensaje('');

            const { error } = await supabase.from('asignaciones').insert({
                alumno_id: alumnoId,
                rutina_base_id: rutinaBaseId,
                dia_semana: dia,
                fecha_asignacion: new Date().toISOString(),
            });

            if (error) throw error;

            setMensaje('✅ Rutina base asignada correctamente. Puede ser personalizada al editar.');
            setTimeout(() => navigate(`/admin/alumno/${alumnoId}`), 1500);

        } catch (error) {
            console.error('❌ Error durante la asignación:', error);
            if (error.code === '23505') {
                alert('❌ Este día ya tiene una rutina asignada.');
            } else {
                alert('❌ Ocurrió un error al asignar la rutina');
            }
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded shadow">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 text-sm text-blue-600 hover:underline"
                >
                    ← Volver atrás
                </button>

                <h1 className="text-xl font-bold mb-4">Seleccionar rutina base para el día</h1>
                {loading ? (
                    <p>Cargando rutinas...</p>
                ) : (
                    <ul className="space-y-4">
                        {rutinas.map((r) => (
                            <li key={r.id} className="p-4 border rounded bg-gray-50">
                                <h3 className="font-bold">{r.nombre}</h3>
                                <p className="text-sm text-gray-600">{r.descripcion}</p>
                                <div className="mt-2">
                                    <button
                                        onClick={() => handleAsignar(r.id)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Asignar esta rutina
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {mensaje && <p className="mt-4 text-green-600 font-medium">{mensaje}</p>}
            </div>
        </AdminLayout>
    );
};

export default AsignarRutina;