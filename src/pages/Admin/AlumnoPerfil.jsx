import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../layouts/AdminLayout';
import DiaCard from '../../components/Rutina/DiaCard';
import RutinasSidebar from '../../components/Rutina/RutinasSidebar';
import RutinaItem from '../../components/Rutina/RutinaItem';
// No necesitamos useAuthUser ni clonarRutinaBaseHaciaPersonalizada aquí para asignación directa
import { toast } from 'react-hot-toast'; // Para notificaciones

import {
    DndContext,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { useDragState } from '../../context/DragStateContext';
import Drawer from '../../components/Drawer';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const AlumnoPerfil = () => {
    const { id } = useParams(); // Este es el alumnoId
    const [alumno, setAlumno] = useState(null);
    const [asignacionesPorDia, setAsignacionesPorDia] = useState({});
    const [rutinasBase, setRutinasBase] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null); // dnd-kit active drag ID
    const { setIsDragging } = useDragState(); // Context setter for global drag state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [perfilResult, rutinasResult, asignacionesResult] = await Promise.all([
                supabase.from('perfiles').select('*').eq('id', id).single(),
                supabase.from('rutinas_base').select('id, nombre').order('nombre'),
                supabase.from('asignaciones')
                    .select(`
                        *,
                        rutina_base:rutina_base_id (id, nombre),
                        rutina_personalizada:rutina_personalizada_id (id, nombre)
                    `)
                    .eq('alumno_id', id)
            ]);

            if (perfilResult.error) throw perfilResult.error;
            setAlumno(perfilResult.data);

            if (rutinasResult.error) throw rutinasResult.error;
            setRutinasBase(rutinasResult.data || []);

            if (asignacionesResult.error) throw asignacionesResult.error;
            const asignaciones = asignacionesResult.data || [];

            const map = {};
            for (const asig of asignaciones) {
                map[asig.dia_semana] = { asignacion: asig, ejercicios: [] };
            }
            setAsignacionesPorDia(map);
        } catch (error) {
            console.error("Error al cargar datos del perfil del alumno:", error);
            setAlumno(null);
            setRutinasBase([]);
            setAsignacionesPorDia({});
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleDrop = async (event) => {
        const itemId = event.active?.id;
        const overId = event.over?.id;

        setActiveId(null);

        if (!itemId || !overId || !overId.startsWith('dia-')) {
            console.warn("❌ Drop inválido", { itemId, overId });
            return;
        }

        const diaSemanaTexto = diasSemana[Number(overId.replace('dia-', ''))];
        const fechaHoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

        if (asignacionesPorDia[Number(overId.replace('dia-', ''))] && asignacionesPorDia[Number(overId.replace('dia-', ''))].asignacion) {
            toast.error(`El ${diaSemanaTexto} ya tiene una rutina asignada.`);
            return;
        }

        // Ya no se verifica el entrenador aquí, se asigna directamente la rutina base.
        const diaIndex = Number(overId.replace('dia-', '')); // Necesitamos el índice numérico para la BD

        try {
            if (itemId.startsWith('rutina-')) {
                const rutinaBaseId = itemId.replace('rutina-', '');
                const alumnoId = id; // id de useParams es el alumnoId

                toast.loading(`Asignando rutina a ${diaSemanaTexto}...`);

                // Verificar si ya existe una asignación para este alumno y día
                // Esto es importante si el estado local `asignacionesPorDia` no está perfectamente sincronizado
                // o para prevenir condiciones de carrera.
                const { data: existingAsignacion, error: fetchError } = await supabase
                    .from('asignaciones')
                    .select('id')
                    .eq('alumno_id', alumnoId)
                    .eq('dia_semana', diaIndex)
                    .maybeSingle();

                if (fetchError) {
                    console.error("Error al verificar asignación existente:", fetchError);
                    toast.dismiss();
                    toast.error('Error al verificar asignaciones previas.');
                    return;
                }

                if (existingAsignacion) {
                    toast.dismiss();
                    toast.warn(`El ${diaSemanaTexto} ya tiene una rutina asignada.`);
                    fetchData(true); // Sincronizar estado local si es necesario
                    return;
                }

                // Crear la asignación directa a rutina_base_id
                const { error: insertError } = await supabase
                    .from('asignaciones')
                    .insert({
                        alumno_id: alumnoId,
                        dia_semana: diaIndex,
                        rutina_base_id: rutinaBaseId,
                        rutina_personalizada_id: null, // Explícitamente null
                        fecha_inicio: fechaHoy, // Asignar con fecha de hoy por defecto
                        // Otros campos de 'asignaciones' si son necesarios y tienen valor por defecto
                    });

                if (insertError) {
                    throw insertError;
                }

                toast.dismiss();
                toast.success(`Rutina base asignada al ${diaSemanaTexto}.`);
                fetchData(true); // Refrescar datos para mostrar la nueva asignación

            } else {
                console.warn(`Item no soportado para asignación: ${itemId}`);
                toast.error('Este elemento no se puede asignar como rutina.');
            }
        } catch (error) {
            toast.dismiss();
            console.error("Error al asignar rutina base:", error);
            toast.error(`Error: ${error.message || 'No se pudo asignar la rutina.'}`);
        }
    };

    return (
            <DndContext
                sensors={sensors}
                onDragStart={(event) => {
                    setActiveId(event.active.id);
                    setIsDragging(true);
                }}
                onDragEnd={(event) => { // handleDrop also clears activeId
                    handleDrop(event); // Ensure handleDrop is called
                    setIsDragging(false);
                }}
                onDragCancel={() => {
                    setActiveId(null);
                    setIsDragging(false);
                }}
                autoScroll={true}
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
                    <div className="md:col-span-1">
                        <RutinasSidebar rutinas={rutinasBase} />
                    </div>

                    <div className="md:col-span-3">
                        <h1 className="text-2xl font-bold mb-4">
                            Rutinas de {alumno?.nombre} {alumno?.apellido}
                        </h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {diasSemana.map((dia, i) => (
                                <DiaCard
                                    key={i}
                                    index={i}
                                    id={`dia-${i}`} // El ID para dnd-kit
                                    dia={dia} // Nombre del día
                                    diaInfo={asignacionesPorDia[i]} // Información de la asignación para este día
                                    alumnoId={id} // Pasar el alumnoId al DiaCard
                                    onAsignacionEliminada={() => fetchData(true)}
                                    onRutinaPersonalizada={() => fetchData(true)} // Para refrescar tras clonar/actualizar asignación
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeId?.startsWith('rutina-') ? (
                        <RutinaItem rutina={rutinasBase.find(r => `rutina-${r.id}` === activeId)} />
                    ) : null}
                </DragOverlay>
            </DndContext>
            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-4">Perfil del Alumno</h2>
                    {alumno && (
                        <div>
                            <p><strong>Nombre:</strong> {alumno.nombre} {alumno.apellido}</p>
                            <p><strong>Email:</strong> {alumno.email}</p>
                            {/* Agrega más detalles del perfil aquí */}
                        </div>
                    )}
                </div>
            </Drawer>
            <button onClick={() => setIsDrawerOpen(true)} className="fixed bottom-4 right-4 bg-cyan-500 text-white p-4 rounded-full shadow-lg">
                Ver Perfil
            </button>
    );
};

export default AlumnoPerfil;
