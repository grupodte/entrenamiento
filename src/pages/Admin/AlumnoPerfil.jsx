import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../layouts/AdminLayout';
import DiaCard from '../../components/Rutina/DiaCard';
import RutinasSidebar from '../../components/Rutina/RutinasSidebar';

import {
    DndContext,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const AlumnoPerfil = () => {
    const { id } = useParams();
    const [alumno, setAlumno] = useState(null);
    const [asignacionesPorDia, setAsignacionesPorDia] = useState({});
    const [rutinasBase, setRutinasBase] = useState([]);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    const fetchData = async () => {
        setLoading(true);

        // Obtener datos del alumno
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', id)
            .single();
        setAlumno(perfil);

        // Obtener rutinas base
        const { data: rutinas } = await supabase
            .from('rutinas_base')
            .select('id, nombre')
            .order('nombre');
        setRutinasBase(rutinas || []);

        // Obtener asignaciones actuales con nombres de rutina
        const { data: asignaciones } = await supabase
            .from('asignaciones')
            .select(`
                *,
                rutina_base:rutina_base_id (id, nombre),
                rutina_personalizada:rutina_personalizada_id (id, nombre)
            `)
            .eq('alumno_id', id);

        const map = {};
        for (const asig of asignaciones) {
            map[asig.dia_semana] = { asignacion: asig, ejercicios: [] };
        }
        setAsignacionesPorDia(map);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleDrop = async (event) => {
        const itemId = event.active?.id;
        const overId = event.over?.id;

        if (!itemId || !overId || !overId.startsWith('dia-')) {
            console.warn("❌ Drop inválido", { itemId, overId });
            return;
        }

        const diaIndex = Number(overId.replace('dia-', ''));

        try {
            if (itemId.startsWith('rutina-')) {
                // Asignar rutina base
                const rutinaBaseId = itemId.replace('rutina-', '');

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

            } else {
                // Asignar ejercicio a rutina personalizada (legacy)
                let asignacion = asignacionesPorDia[diaIndex];
                let rutinaId;

                if (!asignacion || !asignacion.asignacion.rutina_personalizada_id) {
                    const { data: nuevaRutina } = await supabase
                        .from('rutinas_personalizadas')
                        .insert({ alumno_id: id })
                        .select()
                        .single();

                    rutinaId = nuevaRutina.id;

                    const { data: nuevaAsignacion } = await supabase
                        .from('asignaciones')
                        .insert({
                            alumno_id: id,
                            dia_semana: diaIndex,
                            rutina_personalizada_id: rutinaId,
                        })
                        .select()
                        .single();

                    asignacion = { asignacion: nuevaAsignacion, ejercicios: [] };
                } else {
                    rutinaId = asignacion.asignacion.rutina_personalizada_id;
                }

                await supabase.from('rutinas_personalizadas_ejercicios').insert({
                    rutina_personalizada_id: rutinaId,
                    ejercicio_id: itemId,
                    orden: asignacion.ejercicios.length + 1,
                });
            }

            fetchData();
        } catch (error) {
            console.error("Error en drop:", error);
        }
    };

    return (
        <AdminLayout>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
                <div className="md:col-span-1">
                    <RutinasSidebar rutinas={rutinasBase} />
                </div>

                <div className="md:col-span-3">
                    <h1 className="text-2xl font-bold mb-4">
                        Rutinas de {alumno?.nombre} {alumno?.apellido}
                    </h1>

                    <DndContext sensors={sensors} onDragEnd={handleDrop} autoScroll={true}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {diasSemana.map((dia, i) => (
                                <DiaCard
                                    key={i}
                                    index={i}
                                    id={`dia-${i}`}
                                    dia={dia}
                                    diaInfo={asignacionesPorDia[i]}
                                />
                            ))}
                        </div>
                    </DndContext>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AlumnoPerfil;
