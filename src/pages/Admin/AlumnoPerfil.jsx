import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../layouts/AdminLayout';
import DiaCard from '../../components/Rutina/DiaCard';
import RutinasSidebar from '../../components/Rutina/RutinasSidebar';
import RutinaItem from '../../components/Rutina/RutinaItem';

import {
    DndContext,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const AlumnoPerfil = () => {
    const { id } = useParams();
    const [alumno, setAlumno] = useState(null);
    const [asignacionesPorDia, setAsignacionesPorDia] = useState({});
    const [rutinasBase, setRutinasBase] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);

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

        const diaIndex = Number(overId.replace('dia-', ''));

        if (asignacionesPorDia[diaIndex] && asignacionesPorDia[diaIndex].asignacion) {
            console.warn(`Día ${diaIndex} ya tiene una rutina asignada.`);
            return;
        }

        try {
            if (itemId.startsWith('rutina-')) {
                const rutinaBaseId = itemId.replace('rutina-', '');

                const { data: existingAsignacion, error: fetchError } = await supabase
                    .from('asignaciones')
                    .select('id')
                    .eq('alumno_id', id)
                    .eq('dia_semana', diaIndex)
                    .maybeSingle();

                if (fetchError) {
                    console.error("Error al verificar asignación existente:", fetchError);
                    return;
                }

                if (existingAsignacion) {
                    console.warn(`El día ${diaIndex} ya tiene una rutina asignada en BD.`);
                    fetchData(true); // actualiza sin loader
                    return;
                }

                await supabase
                    .from('asignaciones')
                    .upsert({
                        alumno_id: id,
                        dia_semana: diaIndex,
                        rutina_base_id: rutinaBaseId,
                        rutina_personalizada_id: null,
                    }, {
                        onConflict: 'alumno_id,dia_semana',
                    });

                console.log(`Rutina ${rutinaBaseId} asignada al día ${diaIndex}`);
                fetchData(true); // refrescar sin loader
            } else {
                console.warn(`Item no soportado: ${itemId}`);
            }
        } catch (error) {
            console.error("Error al asignar rutina:", error);
        }
    };

    return (
        <AdminLayout>
            <DndContext
                sensors={sensors}
                onDragStart={(event) => setActiveId(event.active.id)}
                onDragEnd={handleDrop}
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
                                    id={`dia-${i}`}
                                    dia={dia}
                                    diaInfo={asignacionesPorDia[i]}
                                    onAsignacionEliminada={() => fetchData(true)} // actualización silenciosa
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
        </AdminLayout>
    );
};

export default AlumnoPerfil;
