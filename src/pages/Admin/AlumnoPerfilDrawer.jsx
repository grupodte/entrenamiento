import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDragState } from '../../context/DragStateContext';
import Drawer from '../../components/Drawer';
import AlumnoPerfilContent from './AlumnoPerfilContent';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const AlumnoPerfilDrawer = () => {
    const { id } = useParams(); // Este es el alumnoId
    const location = useLocation();
    const { alumnoInicial } = location.state || {};
    const [alumno, setAlumno] = useState(alumnoInicial);

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
                alumnoInicial ? { data: alumnoInicial } : supabase.from('perfiles').select('id, nombre, apellido, email').eq('id', id).single(),
                supabase.from('rutinas_base').select('id, nombre').order('nombre'),
                supabase.from('asignaciones')
                    .select(`
                        id, dia_semana, rutina_base_id, rutina_personalizada_id,
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
    }, [id, alumnoInicial]);

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

        const diaIndex = Number(overId.replace('dia-', ''));

        try {
            if (itemId.startsWith('rutina-')) {
                const rutinaBaseId = itemId.replace('rutina-', '');
                const alumnoId = id;

                toast.loading(`Asignando rutina a ${diaSemanaTexto}...`);

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
                    fetchData(true);
                    return;
                }

                const { error: insertError } = await supabase
                    .from('asignaciones')
                    .insert({
                        alumno_id: alumnoId,
                        dia_semana: diaIndex,
                        rutina_base_id: rutinaBaseId,
                        rutina_personalizada_id: null,
                        fecha_inicio: fechaHoy,
                    });

                if (insertError) {
                    throw insertError;
                }

                toast.dismiss();
                toast.success(`Rutina base asignada al ${diaSemanaTexto}.`);
                fetchData(true);

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
        <>
            <AlumnoPerfilContent
                alumno={alumno}
                asignacionesPorDia={asignacionesPorDia}
                rutinasBase={rutinasBase}
                fetchData={fetchData}
                diasSemana={diasSemana}
                handleDrop={handleDrop}
                activeId={activeId}
                setActiveId={setActiveId}
                setIsDragging={setIsDragging}
                sensors={sensors}
                onCloseDrawer={() => setIsDrawerOpen(false)}
            />
            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-4">Perfil del Alumno</h2>
                    {alumno && (
                        <div>
                            <p><strong>Nombre:</strong> {alumno.nombre} {alumno.apellido}</p>
                            <p><strong>Email:</strong> {alumno.email}</p>
                        </div>
                    )}
                </div>
            </Drawer>
            <button onClick={() => setIsDrawerOpen(true)} className="fixed bottom-4 right-4 bg-cyan-500 text-white p-4 rounded-full shadow-lg">
                Ver Perfil
            </button>
        </>
    );
};

export default AlumnoPerfilDrawer;
