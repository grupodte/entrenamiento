import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
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
                .select('id, rol, nombre, apellido, edad, objetivo, nivel, estado, avatar_url, email, user_id, telefono, genero, fecha_nacimiento, fecha_creacion, fecha_actualizacion, biografia, ciudad, pais')
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
            const { error } = await supabase
                .from('perfiles')
                .update({
                    nombre: datosEditados.nombre,
                    apellido: datosEditados.apellido,
                    edad: datosEditados.edad,
                    email: datosEditados.email,
                    telefono: datosEditados.telefono,
                    genero: datosEditados.genero,
                    fecha_nacimiento: datosEditados.fecha_nacimiento,
                    objetivo: datosEditados.objetivo,
                    nivel: datosEditados.nivel,
                    estado: datosEditados.estado,
                    biografia: datosEditados.biografia,
                    ciudad: datosEditados.ciudad,
                    pais: datosEditados.pais
                })
                .eq('id', alumnoId);

            if (error) throw error;

            setAlumno(datosEditados);
            setEditando(false);
            toast.success('Información actualizada correctamente');
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
            className="p-6 bg-white/5 rounded-lg backdrop-blur border border-white/10 space-y-6"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Columna 1: Información Personal */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">
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
                                    {alumno?.edad || 'No especificado'} años
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
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
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
                    </div>
                </div>

                {/* Columna 2: Contacto */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">
                        Información de Contacto
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
                                    <FaPhone className="text-blue-400" />
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
                                    <FaMapMarkerAlt className="text-blue-400" />
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
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    Sin avatar
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna 3: Información del entrenamiento */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">
                        Información de Entrenamiento
                    </h3>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Objetivo
                            </label>
                            {editando ? (
                                <input
                                    type="text"
                                    value={datosEditados.objetivo || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, objetivo: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    placeholder="Objetivo del alumno"
                                />
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    {alumno?.objetivo || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Nivel
                            </label>
                            {editando ? (
                                <select
                                    value={datosEditados.nivel || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, nivel: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="" disabled>Seleccione nivel</option>
                                    <option value="principiante">Principiante</option>
                                    <option value="intermedio">Intermedio</option>
                                    <option value="avanzado">Avanzado</option>
                                </select>
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    <span className={`${
                                        alumno?.nivel === 'principiante' ? 'bg-green-500/20 text-green-400' :
                                        alumno?.nivel === 'intermedio' ? 'bg-yellow-500/20 text-yellow-400' :
                                        alumno?.nivel === 'avanzado' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    } inline-block px-2 py-1 rounded text-sm`}>
                                        {alumno?.nivel || 'No especificado'}
                                    </span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Estado
                            </label>
                            {editando ? (
                                <select
                                    value={datosEditados.estado || ''}
                                    onChange={(e) => setDatosEditados({...datosEditados, estado: e.target.value})}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="" disabled>Seleccione estado</option>
                                    <option value="Aprobado">Aprobado</option>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Rechazado">Rechazado</option>
                                </select>
                            ) : (
                                <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                    <span className={`${
                                        alumno?.estado === 'Aprobado' ? 'bg-green-500/20 text-green-400' :
                                        alumno?.estado === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
                                        alumno?.estado === 'Rechazado' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    } inline-block px-2 py-1 rounded text-sm`}>
                                        {alumno?.estado || 'No especificado'}
                                    </span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Rol
                            </label>
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                                    {alumno?.rol || 'alumno'}
                                </span>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Usuario vinculado
                            </label>
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 text-xs font-mono">
                                {alumno?.user_id || 'No especificado'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Fecha de Registro
                            </label>
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                                <FaCalendarAlt className="text-blue-400" />
                                {alumno?.fecha_creacion ? new Date(alumno.fecha_creacion).toLocaleDateString('es-ES') : 'No disponible'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">
                                Última Actualización
                            </label>
                            <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10">
                                {alumno?.fecha_actualizacion ? new Date(alumno.fecha_actualizacion).toLocaleDateString('es-ES') : 'No disponible'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Biografía - ocupa todo el ancho */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">
                    Biografía
                </h3>
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">
                        Biografía
                    </label>
                    {editando ? (
                        <textarea
                            value={datosEditados.biografia || ''}
                            onChange={(e) => setDatosEditados({...datosEditados, biografia: e.target.value})}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                            rows={4}
                            placeholder="Breve biografía del alumno"
                        />
                    ) : (
                        <p className="text-white bg-white/5 px-3 py-2 rounded border border-white/10 min-h-[100px]">
                            {alumno?.biografia || 'Sin biografía'}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default InfoAlumno;

