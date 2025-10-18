import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaPhone, FaMapMarkerAlt, FaWeight, FaRuler, FaHeartbeat, FaBullseye, FaUtensils, FaDumbbell, FaFileMedical } from 'react-icons/fa';
import { MdDirectionsRun as FaActivityPulse } from 'react-icons/md';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const InfoAlumno = ({ alumnoId }) => {
    const [alumno, setAlumno] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState(false);
    const [datosEditados, setDatosEditados] = useState({});

    useEffect(() => {
        fetchAlumnoData();
    }, [alumnoId]);

    const fetchAlumnoData = async () => {
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', alumnoId)
                .single();

            if (error) throw error;
            setAlumno(data);
            setDatosEditados(data);
        } catch (error) {
            console.error('Error al obtener datos del alumno:', error);
            toast.error('Error al cargar la información del alumno');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Preparar datos para actualizar (excluir campos no editables)
            const { id, user_id, fecha_creacion, rol, onboarding_completed, ...datosActualizables } = datosEditados;
            
            const { error } = await supabase
                .from('perfiles')
                .update({
                    ...datosActualizables,
                    fecha_actualizacion: new Date().toISOString()
                })
                .eq('id', alumnoId);

            if (error) throw error;

            setAlumno(datosEditados);
            setEditando(false);
            toast.success('Información actualizada correctamente');
            // Recargar datos para obtener la fecha de actualización correcta
            fetchAlumnoData();
        } catch (error) {
            console.error('Error al actualizar:', error);
            toast.error('Error al actualizar la información');
        }
    };

    const handleCancel = () => {
        setDatosEditados(alumno);
        setEditando(false);
    };

    if (loading) {
        return (
            <div className="p-6 bg-white/5 rounded-lg backdrop-blur border border-white/10">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-white/10 rounded w-1/3"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    <div className="h-20 bg-white/10 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            className="p-6 bg-white/5 rounded-lg backdrop-blur border border-white/10 space-y-6 pb-safe"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header con botón de editar */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUser className="text-blue-400" />
                    Información del Alumno
                </h2>
                {!editando ? (
                    <motion.button
                        onClick={() => setEditando(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaEdit />
                        Editar
                    </motion.button>
                ) : (
                    <div className="flex gap-2">
                        <motion.button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaSave />
                            Guardar
                        </motion.button>
                        <motion.button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaTimes />
                            Cancelar
                        </motion.button>
                    </div>
                )}
            </div>

            {/* Información del alumno */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Columna 1: Información Personal */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2 flex items-center gap-2">
                        <FaUser className="text-blue-400" />
                        Información Personal
                    </h3>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Nombre Completo
                            </label>
                            <div className="flex gap-2">
                                {editando ? (
                                    <>
                                        <input
                                            type="text"
                                            value={datosEditados.nombre || ''}
                                            onChange={(e) => setDatosEditados({...datosEditados, nombre: e.target.value})}
                                            className="w-1/2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                            placeholder="Nombre"
                                        />
                                        <input
                                            type="text"
                                            value={datosEditados.apellido || ''}
                                            onChange={(e) => setDatosEditados({...datosEditados, apellido: e.target.value})}
                                            className="w-1/2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                            placeholder="Apellido"
                                        />
                                    </>
                                ) : (
                                    <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                        {alumno?.nombre || 'No especificado'} {alumno?.apellido || 'No especificado'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Edad
                            </label>
                            {editando ? (
                                <input
                                    type="number"
                                    value={datosEditados.edad || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, edad: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    placeholder="Edad del alumno"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    {alumno?.edad ? `${alumno.edad} años` : 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Género
                            </label>
                            {editando ? (
                                <select
                                    value={datosEditados.genero || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, genero: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="" disabled>Seleccione Género</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="femenino">Femenino</option>
                                    <option value="otro">Otro</option>
                                </select>
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 capitalize">
                                    {alumno?.genero || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Fecha de Nacimiento
                            </label>
                            {editando ? (
                                <input
                                    type="date"
                                    value={datosEditados.fecha_nacimiento ? datosEditados.fecha_nacimiento.split('T')[0] : ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, fecha_nacimiento: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                    <FaCalendarAlt className="text-blue-400" />
                                    {alumno?.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toLocaleDateString('es-ES') : 'No disponible'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Avatar
                            </label>
                            {alumno?.avatar_url ? (
                                <img 
                                    src={alumno.avatar_url} 
                                    alt="Avatar" 
                                    className="w-20 h-20 rounded-full border border-white/20 object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                                    <FaUser className="text-white/40 text-2xl" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna 2: Contacto y Ubicación */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-green-400" />
                        Contacto y Ubicación
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Email
                            </label>
                            {editando ? (
                                <input
                                    type="email"
                                    value={datosEditados.email || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, email: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                    <FaEnvelope className="text-blue-400" />
                                    {alumno?.email || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Teléfono
                            </label>
                            {editando ? (
                                <input
                                    type="tel"
                                    value={datosEditados.telefono || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, telefono: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    placeholder="Número de teléfono"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                    <FaPhone className="text-green-400" />
                                    {alumno?.telefono || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Ciudad
                            </label>
                            {editando ? (
                                <input
                                    type="text"
                                    value={datosEditados.ciudad || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, ciudad: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    placeholder="Ciudad de residencia"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-green-400" />
                                    {alumno?.ciudad || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                País
                            </label>
                            {editando ? (
                                <input
                                    type="text"
                                    value={datosEditados.pais || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, pais: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    placeholder="País de residencia"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    {alumno?.pais || 'No especificado'}
                                </p>
                            )}
                        </div>

                        {/* Sistema */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1">
                                        Rol
                                    </label>
                                    <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                        <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm capitalize">
                                            {alumno?.rol || 'alumno'}
                                        </span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1">
                                        Onboarding Completado
                                    </label>
                                    <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                        <span className={`inline-block px-2 py-1 rounded text-sm ${
                                            alumno?.onboarding_completed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {alumno?.onboarding_completed ? 'Sí' : 'No'}
                                        </span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1">
                                        Fecha de Registro
                                    </label>
                                    <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2 text-sm">
                                        <FaCalendarAlt className="text-blue-400" />
                                        {alumno?.fecha_creacion ? new Date(alumno.fecha_creacion).toLocaleDateString('es-ES') : 'No disponible'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1">
                                        Última Actualización
                                    </label>
                                    <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 text-sm">
                                        {alumno?.fecha_actualizacion ? new Date(alumno.fecha_actualizacion).toLocaleDateString('es-ES') : 'No disponible'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna 3: Información de Fitness */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2 flex items-center gap-2">
                        <FaDumbbell className="text-orange-400" />
                        Información de Fitness
                    </h3>
                    
                    <div className="space-y-3">
                        {/* Objetivos y Nivel */}
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Objetivo Principal
                            </label>
                            {editando ? (
                                <textarea
                                    value={datosEditados.objetivo || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, objetivo: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                                    rows={2}
                                    placeholder="Objetivo del alumno"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-start gap-2">
                                    <FaBullseye className="text-orange-400 mt-0.5" />
                                    {alumno?.objetivo || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Nivel de Experiencia
                            </label>
                            {editando ? (
                                <select
                                    value={datosEditados.experiencia || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, experiencia: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="">Seleccione experiencia</option>
                                    <option value="principiante">Principiante</option>
                                    <option value="intermedio">Intermedio</option>
                                    <option value="avanzado">Avanzado</option>
                                </select>
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    <span className={`inline-block px-2 py-1 rounded text-sm capitalize ${
                                        alumno?.experiencia === 'principiante' ? 'bg-green-500/20 text-green-400' :
                                        alumno?.experiencia === 'intermedio' ? 'bg-yellow-500/20 text-yellow-400' :
                                        alumno?.experiencia === 'avanzado' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                        {alumno?.experiencia || 'No especificado'}
                                    </span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Nivel Asignado
                            </label>
                            {editando ? (
                                <select
                                    value={datosEditados.nivel || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, nivel: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="">Seleccione nivel</option>
                                    <option value="principiante">Principiante</option>
                                    <option value="intermedio">Intermedio</option>
                                    <option value="avanzado">Avanzado</option>
                                </select>
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    <span className={`inline-block px-2 py-1 rounded text-sm capitalize ${
                                        alumno?.nivel === 'principiante' ? 'bg-green-500/20 text-green-400' :
                                        alumno?.nivel === 'intermedio' ? 'bg-yellow-500/20 text-yellow-400' :
                                        alumno?.nivel === 'avanzado' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                        {alumno?.nivel || 'No especificado'}
                                    </span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Estado del Alumno
                            </label>
                            {editando ? (
                                <select
                                    value={datosEditados.estado || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, estado: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="">Seleccione estado</option>
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Suspendido">Suspendido</option>
                                </select>
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                                        alumno?.estado === 'Activo' ? 'bg-green-500/20 text-green-400' :
                                        alumno?.estado === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
                                        alumno?.estado === 'Inactivo' || alumno?.estado === 'Suspendido' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                        {alumno?.estado || 'No especificado'}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Actividad Física */}
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Nivel de Actividad Física
                            </label>
                            {editando ? (
                                <select
                                    value={datosEditados.actividad_fisica || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, actividad_fisica: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="">Seleccione actividad</option>
                                    <option value="sedentario">Sedentario</option>
                                    <option value="ligero">Actividad ligera</option>
                                    <option value="moderado">Actividad moderada</option>
                                    <option value="intenso">Actividad intensa</option>
                                    <option value="muy_intenso">Muy intenso</option>
                                </select>
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2 capitalize">
                                    <FaActivityPulse className="text-purple-400" />
                                    {alumno?.actividad_fisica || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Frecuencia de Entrenamiento
                            </label>
                            {editando ? (
                                <input
                                    type="text"
                                    value={datosEditados.frecuencia_entrenamiento || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, frecuencia_entrenamiento: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    placeholder="ej: 3-4 veces por semana"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    {alumno?.frecuencia_entrenamiento || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Preferencia de Inicio
                            </label>
                            {editando ? (
                                <input
                                    type="text"
                                    value={datosEditados.preferencia_inicio || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, preferencia_inicio: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    placeholder="Preferencia para comenzar"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    {alumno?.preferencia_inicio || 'No especificado'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Sección de Medidas Corporales */}
            <div className="mt-8 space-y-6">
                <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2 flex items-center gap-2">
                    <FaWeight className="text-yellow-400" />
                    Medidas Corporales y Salud
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Peso Actual */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Peso Actual (kg)
                        </label>
                        {editando ? (
                            <input
                                type="number"
                                step="0.1"
                                value={datosEditados.peso || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, peso: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                placeholder="70.5"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                <FaWeight className="text-yellow-400" />
                                {alumno?.peso ? `${alumno.peso} kg` : 'No especificado'}
                            </p>
                        )}
                    </div>

                    {/* Altura */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Altura (m)
                        </label>
                        {editando ? (
                            <input
                                type="number"
                                step="0.01"
                                value={datosEditados.altura || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, altura: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                placeholder="1.75"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                <FaRuler className="text-blue-400" />
                                {alumno?.altura ? `${alumno.altura} m` : 'No especificado'}
                            </p>
                        )}
                    </div>

                    {/* IMC */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            IMC
                        </label>
                        {editando ? (
                            <input
                                type="number"
                                step="0.1"
                                value={datosEditados.imc || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, imc: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                placeholder="22.5"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                {alumno?.imc ? (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                                        alumno.imc < 18.5 ? 'bg-blue-500/20 text-blue-400' :
                                        alumno.imc < 25 ? 'bg-green-500/20 text-green-400' :
                                        alumno.imc < 30 ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                        <FaHeartbeat />
                                        {alumno.imc}
                                    </span>
                                ) : 'No especificado'}
                            </p>
                        )}
                    </div>

                    {/* Porcentaje de Grasa */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            % Grasa Corporal
                        </label>
                        {editando ? (
                            <input
                                type="number"
                                step="0.1"
                                value={datosEditados.porcentaje_grasa || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, porcentaje_grasa: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                placeholder="15.5"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                {alumno?.porcentaje_grasa ? `${alumno.porcentaje_grasa}%` : 'No especificado'}
                            </p>
                        )}
                    </div>

                    {/* Cintura */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Cintura (cm)
                        </label>
                        {editando ? (
                            <input
                                type="number"
                                value={datosEditados.cintura_cm || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, cintura_cm: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                placeholder="80"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                {alumno?.cintura_cm ? `${alumno.cintura_cm} cm` : 'No especificado'}
                            </p>
                        )}
                    </div>

                    {/* Fecha último peso */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Última pesada
                        </label>
                        {editando ? (
                            <input
                                type="date"
                                value={datosEditados.fecha_ultimo_peso ? datosEditados.fecha_ultimo_peso.split('T')[0] : ''}
                                onChange={(e) => setDatosEditados({...datosEditados, fecha_ultimo_peso: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 text-sm">
                                {alumno?.fecha_ultimo_peso ? new Date(alumno.fecha_ultimo_peso).toLocaleDateString('es-ES') : 'No registrado'}
                            </p>
                        )}
                    </div>

                    {/* Peso Meta */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Peso Meta (kg)
                        </label>
                        {editando ? (
                            <input
                                type="number"
                                step="0.1"
                                value={datosEditados.meta_peso || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, meta_peso: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                placeholder="65.0"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                <FaBullseye className="text-green-400" />
                                {alumno?.meta_peso ? `${alumno.meta_peso} kg` : 'No especificado'}
                            </p>
                        )}
                    </div>

                    {/* Grasa Meta */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            % Grasa Meta
                        </label>
                        {editando ? (
                            <input
                                type="number"
                                step="0.1"
                                value={datosEditados.meta_grasa || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, meta_grasa: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                placeholder="12.0"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                <FaBullseye className="text-green-400" />
                                {alumno?.meta_grasa ? `${alumno.meta_grasa}%` : 'No especificado'}
                            </p>
                        )}
                    </div>

                    {/* Cintura Meta */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Cintura Meta (cm)
                        </label>
                        {editando ? (
                            <input
                                type="number"
                                value={datosEditados.meta_cintura || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, meta_cintura: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                placeholder="75"
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                <FaBullseye className="text-green-400" />
                                {alumno?.meta_cintura ? `${alumno.meta_cintura} cm` : 'No especificado'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sección de Nutrición */}
            <div className="mt-8 space-y-6">
                <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2 flex items-center gap-2">
                    <FaUtensils className="text-green-400" />
                    Información Nutricional
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Frecuencia de Dieta
                        </label>
                        {editando ? (
                            <select
                                value={datosEditados.frecuencia_dieta || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, frecuencia_dieta: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                            >
                                <option value="">Seleccione frecuencia</option>
                                <option value="estricta">Estricta</option>
                                <option value="moderada">Moderada</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 capitalize">
                                {alumno?.frecuencia_dieta || 'No especificado'}
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Comentarios sobre Dieta
                        </label>
                        {editando ? (
                            <textarea
                                value={datosEditados.comentarios_dieta || ''}
                                onChange={(e) => setDatosEditados({...datosEditados, comentarios_dieta: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                                rows={3}
                                placeholder="Comentarios adicionales sobre la dieta..."
                            />
                        ) : (
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 min-h-[80px]">
                                {alumno?.comentarios_dieta || 'Sin comentarios'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sección de Condiciones Médicas */}
            <div className="mt-8 space-y-6">
                <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2 flex items-center gap-2">
                    <FaFileMedical className="text-red-400" />
                    Información Médica
                </h3>
                
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">
                        Condiciones Médicas
                    </label>
                    {editando ? (
                        <textarea
                            value={datosEditados.condiciones_medicas || ''}
                            onChange={(e) => setDatosEditados({...datosEditados, condiciones_medicas: e.target.value})}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                            rows={4}
                            placeholder="Condiciones médicas, alergias, lesiones, medicamentos, etc..."
                        />
                    ) : (
                        <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 min-h-[100px] flex items-start gap-2">
                            <FaFileMedical className="text-red-400 mt-0.5" />
                            <span>{alumno?.condiciones_medicas || 'Sin condiciones médicas reportadas'}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Sección de Biografía */}
            <div className="mt-8 space-y-6">
                <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2 flex items-center gap-2">
                    <FaUser className="text-purple-400" />
                    Biografía
                </h3>
                
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">
                        Biografía Personal
                    </label>
                    {editando ? (
                        <textarea
                            value={datosEditados.biografia || ''}
                            onChange={(e) => setDatosEditados({...datosEditados, biografia: e.target.value})}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                            rows={4}
                            placeholder="Breve biografía del alumno, historia personal, motivaciones..."
                        />
                    ) : (
                        <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 min-h-[100px] flex items-start gap-2">
                            <FaUser className="text-purple-400 mt-0.5" />
                            <span>{alumno?.biografia || 'Sin biografía disponible'}</span>
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default InfoAlumno;

