// src/pages/Admin/AsignarRutina.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../layouts/AdminLayout';


const AsignarRutina = () => {
    const { id: alumnoId } = useParams();
    const { user } = useAuth(); // Para obtener info del entrenador
    const [searchParams] = useSearchParams();
    const dia = parseInt(searchParams.get('dia'), 10);
    const navigate = useNavigate();

    const [rutinas, setRutinas] = useState([]);
    const [alumno, setAlumno] = useState(null); // Para info del alumno
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtener rutinas
                const { data: rutinasData, error: rutinasError } = await supabase
                    .from('rutinas_base')
                    .select('*');
                
                if (rutinasError) throw rutinasError;
                setRutinas(rutinasData);

                // Obtener datos del alumno para el email
                const { data: alumnoData, error: alumnoError } = await supabase
                    .from('perfiles')
                    .select('nombre, apellido, email')
                    .eq('id', alumnoId)
                    .single();
                
                if (alumnoError) throw alumnoError;
                setAlumno(alumnoData);
                
            } catch (error) {
                console.error('Error cargando datos:', error);
            } finally {
                setLoading(false);
            }
        };
        
        if (alumnoId) {
            fetchData();
        }
    }, [alumnoId]);

    const handleAsignar = async (rutinaBaseId) => {
        try {
            setMensaje('');
            
            // Obtener información de la rutina seleccionada
            const rutinaSeleccionada = rutinas.find(r => r.id === rutinaBaseId);
            if (!rutinaSeleccionada) {
                throw new Error('Rutina no encontrada');
            }

            // Asignar la rutina en la base de datos
            const { error } = await supabase.from('asignaciones').insert({
                alumno_id: alumnoId,
                rutina_base_id: rutinaBaseId,
                dia_semana: dia,
                fecha_asignacion: new Date().toISOString(),
            });

            if (error) throw error;

            setMensaje('✅ Rutina base asignada correctamente.');
            
            // Enviar notificación por email (no bloqueante)
            if (alumno?.email && user?.nombre) {
                try {
                    console.log('📧 Enviando notificación de rutina asignada...');
                    const notificationResult = await notificationService.sendRutinaAsignada({
                        userEmail: alumno.email,
                        userName: `${alumno.nombre} ${alumno.apellido || ''}`.trim(),
                        rutinaName: rutinaSeleccionada.nombre,
                        trainerName: user.nombre || 'Tu entrenador'
                    });
                    
                    if (notificationResult.success) {
                        console.log('✅ Notificación enviada exitosamente');
                        setMensaje('✅ Rutina asignada y notificación enviada correctamente.');
                    } else {
                        console.warn('⚠️ Rutina asignada pero falló el envío de notificación:', notificationResult.error);
                        setMensaje('✅ Rutina asignada correctamente (la notificación no pudo enviarse).');
                    }
                } catch (emailError) {
                    console.warn('⚠️ Error enviando notificación:', emailError);
                    setMensaje('✅ Rutina asignada correctamente (la notificación no pudo enviarse).');
                }
            } else {
                console.warn('⚠️ No se puede enviar notificación: faltan datos del alumno o entrenador');
            }
            
            // Navegar después de 2 segundos para mostrar el mensaje
            setTimeout(() => navigate(`/admin/alumno/${alumnoId}`), 2000);

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
            <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded shadow">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 text-sm text-blue-600 hover:underline"
                >
                    ← Volver atrás
                </button>

                <h1 className="text-xl font-bold mb-4">Seleccionar rutina base para el día</h1>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
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
    );
};

export default AsignarRutina;