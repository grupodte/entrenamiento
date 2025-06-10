// src/pages/Admin/AlumnoPerfil.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FaArrowLeft, FaEnvelope, FaBullseye, FaSignal } from 'react-icons/fa';
import AdminLayout from './AdminLayout';


const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const AlumnoPerfil = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [alumno, setAlumno] = useState(null);
    const [rutinaPorDia, setRutinaPorDia] = useState({});
    const [loading, setLoading] = useState(true);

    

    useEffect(() => {
        const fetchData = async () => {
            // Obtener perfil del alumno
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', id)
                .single();
            setAlumno(perfil);

            // Obtener asignaciones por día
            const { data: asignaciones, error: errorAsignaciones } = await supabase
                .from('asignaciones')
                .select('dia_semana, rutina_personalizada_id')
                .eq('alumno_id', id);

            if (errorAsignaciones) {
                console.error('Error asignaciones:', errorAsignaciones);
                setLoading(false);
                return;
            }

            const rutinaPorDiaTemp = {};

            for (const asignacion of asignaciones) {
                const { data: ejercicios } = await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .select('dia_semana, orden, series, reps, pausa, carga, ejercicio_id, ejercicios(nombre)')
                    .eq('rutina_personalizada_id', asignacion.rutina_personalizada_id)
                    .eq('dia_semana', asignacion.dia_semana)
                    .order('orden', { ascending: true });

                if (!rutinaPorDiaTemp[asignacion.dia_semana]) {
                    rutinaPorDiaTemp[asignacion.dia_semana] = [];
                }

                rutinaPorDiaTemp[asignacion.dia_semana].push(...ejercicios);
            }

            setRutinaPorDia(rutinaPorDiaTemp);
            setLoading(false);
        };

        fetchData();
    }, [id]);
    
    
    

    const irASeleccionarRutina = (dia) => {
        navigate(`/asignar-rutina/${id}?dia=${dia}`);
    };

    const irAEditarDia = (dia) => {
        navigate(`/editar-rutina-dia/${id}?dia=${dia}`);
    };

    if (loading) return <p className="text-center mt-10">Cargando datos del alumno...</p>;

    const eliminarDia = async (dia) => {
        if (!confirm(`¿Estás seguro de eliminar la rutina del día ${diasSemana[dia]}?`)) return;

        const { data: rutina } = await supabase
            .from('rutinas_personalizadas')
            .select('id')
            .eq('alumno_id', id)
            .order('fecha_inicio', { ascending: false })
            .limit(1)
            .single();

        if (!rutina?.id) return;

        const { error } = await supabase
            .from('rutinas_personalizadas_ejercicios')
            .delete()
            .eq('rutina_personalizada_id', rutina.id)
            .eq('dia_semana', dia);

        if (error) {
            alert('❌ No se pudo eliminar la rutina de ese día');
            return;
        }

        alert('✅ Rutina del día eliminada');
        window.location.reload(); // O refactorizá `fetchData()` y llamalo de nuevo
    };
      

    return (
        <AdminLayout>
        <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <button
                onClick={() => navigate('/admin/alumnos')}
                className="text-blue-600 hover:underline mb-6 flex items-center"
            >
                <FaArrowLeft className="mr-2" /> Volver a alumnos
            </button>

            <div className="mb-6">
                <h1 className="text-3xl font-bold">{alumno?.nombre} {alumno?.apellido}</h1>
                <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
                    <FaEnvelope /> {alumno?.email}
                </p>
                <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
                    <FaBullseye /> Objetivo: <strong>{alumno?.objetivo || 'No definido'}</strong>
                </p>
                <p className="text-sm text-gray-700 flex items-center gap-2">
                    <FaSignal /> Nivel: <strong>{alumno?.nivel || 'No definido'}</strong>
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {diasSemana.map((dia, index) => {
                    const ejercicios = rutinaPorDia[index];
                    const tieneRutina = ejercicios?.length > 0;

                    return (
                        <div key={index} className={`border rounded p-4 ${tieneRutina ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <h3 className="font-bold mb-2">{dia}</h3>

                            {tieneRutina ? (
                                <>
                                    <ul className="text-sm mb-2">
                                        {ejercicios.map((ej, i) => (
                                            <li key={i}>✅ {ej.ejercicios?.nombre} ({ej.series}x{ej.reps})</li>
                                        ))}
                                    </ul>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => irAEditarDia(index)}
                                            className="text-yellow-700 text-sm underline hover:opacity-80"
                                        >
                                            ✏️ Editar día
                                        </button>
                                        <button
                                            onClick={() => eliminarDia(index)}
                                            className="text-red-600 text-sm underline hover:opacity-80"
                                        >
                                            🗑️ Quitar rutina
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    className="text-blue-600 hover:underline text-sm"
                                    onClick={() => irASeleccionarRutina(index)}
                                >
                                    ➕ Asignar rutina a este día
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        </AdminLayout>    

    );
};

export default AlumnoPerfil;
