import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaUserCircle, FaEnvelope, FaPhone, FaBirthdayCake, FaTransgender, FaMapMarkerAlt, FaBullseye, FaChartLine, FaBook, FaExclamationTriangle, FaSave, FaArrowLeft } from 'react-icons/fa';
import Drawer from '../../components/Drawer';
import DrawerLoader from '../../components/DrawerLoader';

const PerfilDrawer = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editPerfil, setEditPerfil] = useState({ nombre: '', apellido: '', edad: '', objetivo: '', nivel: '', telefono: '', genero: '', fecha_nacimiento: '', biografia: '', ciudad: '', pais: '', avatar_url: '' });
    const [email, setEmail] = useState('');
    const [preview, setPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isOpen || !user) return;
        setEmail(user.email);

        const fetchPerfil = async () => {
            setLoading(true);
            setError('');
            const { data, error: err } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
            if (err) {
                console.error('Error al cargar el perfil:', err);
                setError('No se pudo cargar el perfil.');
            } else {
                setPerfil(data);
                // Configurar datos para edición
                setEditPerfil(prev => ({ ...prev, ...data }));
                setPreview(data?.avatar_url || '');
            }
            setLoading(false);
        };
        fetchPerfil();
    }, [isOpen, user]);

    const handleEditProfile = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditPerfil(prev => ({ ...prev, ...perfil }));
        setPreview(perfil?.avatar_url || '');
        setError('');
        setSuccess('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditPerfil(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditPerfil(prev => ({ ...prev, avatarFile: file }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            let avatar_url = editPerfil.avatar_url;

            if (editPerfil.avatarFile) {
                const ext = editPerfil.avatarFile.name.split('.').pop();
                const fileName = `${user.id}_${Date.now()}.${ext}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, editPerfil.avatarFile);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatar_url = publicUrlData.publicUrl;
            }

            const { error: updateError } = await supabase
                .from('perfiles')
                .update({
                    nombre: editPerfil.nombre,
                    apellido: editPerfil.apellido,
                    edad: editPerfil.edad ? parseInt(editPerfil.edad) : null,
                    objetivo: editPerfil.objetivo,
                    nivel: editPerfil.nivel,
                    telefono: editPerfil.telefono,
                    genero: editPerfil.genero,
                    fecha_nacimiento: editPerfil.fecha_nacimiento,
                    biografia: editPerfil.biografia,
                    ciudad: editPerfil.ciudad,
                    pais: editPerfil.pais,
                    avatar_url: avatar_url
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Actualizar estados locales
            const updatedPerfil = { ...editPerfil, avatar_url, avatarFile: undefined };
            setPerfil(updatedPerfil);
            setEditPerfil(updatedPerfil);
            setPreview(avatar_url);

            setSuccess('Perfil actualizado correctamente');
            
            // Volver a vista de perfil después de un delay
            setTimeout(() => {
                setIsEditing(false);
                setSuccess('');
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(`Error al guardar cambios: ${err.message || err}`);
        } finally {
            setSaving(false);
        }
    };

    const InfoRow = ({ icon, label, value }) => {
        if (!value) return null;
        return (
            <div className="flex items-center text-gray-300">
                {icon && <span className="mr-3 text-cyan-400 text-lg">{icon}</span>}
                <div>
                    <p className="text-sm font-semibold text-gray-400">{label}</p>
                    <p className="text-base text-white">{value}</p>
                </div>
            </div>
        );
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            {loading ? (
                <DrawerLoader />
            ) : error ? (
                <div className="bg-gray-800 text-white font-sans p-4">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-white">Error</h1>
                        <p className="text-sm text-gray-400">Problema al cargar el perfil</p>
                    </div>
                    <div className="text-center p-6 bg-red-900/50 rounded-lg">
                        <FaExclamationTriangle className="mx-auto mb-3 text-3xl text-red-400" />
                        <p className="text-red-300 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            ) : !perfil ? (
                <div className="bg-gray-800 text-white font-sans p-4">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
                        <p className="text-sm text-gray-400">Perfil no encontrado</p>
                    </div>
                    <div className="text-center p-6 bg-gray-700 rounded-lg">
                        <FaUserCircle className="mx-auto mb-3 text-6xl text-gray-400" />
                        <p className="text-gray-300 mb-4">No se encontró información de perfil.</p>
                        <button 
                            onClick={handleEditProfile}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Crear Perfil
                        </button>
                    </div>
                </div>
            ) : isEditing ? (
                <div className="bg-gray-800 text-white font-sans p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <button 
                            onClick={handleCancelEdit}
                            className="p-2 rounded-full hover:bg-gray-700"
                        >
                            <FaArrowLeft className="text-white" />
                        </button>
                        <h1 className="text-xl font-bold text-white">Editar Perfil</h1>
                        <div /> {/* Spacer */}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col items-center mb-6">
                            {preview ?
                                <img src={preview} alt="avatar" className="w-28 h-28 rounded-full object-cover border-4 border-cyan-500 shadow-md" />
                                :
                                <FaUserCircle className="text-7xl mb-2 text-blue-400" />
                            }
                            <label className="mt-3 text-sm text-cyan-400 cursor-pointer hover:underline font-medium">
                                Cambiar foto
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div>

                        {/* Personal Info Section */}
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="nombre" className="block text-sm mb-1 capitalize">Nombre</label>
                                <input id="nombre" name="nombre" value={editPerfil.nombre || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu nombre" />
                            </div>
                            <div>
                                <label htmlFor="apellido" className="block text-sm mb-1 capitalize">Apellido</label>
                                <input id="apellido" name="apellido" value={editPerfil.apellido || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu apellido" />
                            </div>
                            <div>
                                <label htmlFor="edad" className="block text-sm mb-1 capitalize">Edad</label>
                                <input id="edad" type="number" name="edad" value={editPerfil.edad || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu edad" />
                            </div>
                            <div>
                                <label htmlFor="telefono" className="block text-sm mb-1 capitalize">Teléfono</label>
                                <input id="telefono" type="tel" name="telefono" value={editPerfil.telefono || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu teléfono" />
                            </div>
                            <div>
                                <label htmlFor="genero" className="block text-sm mb-1">Género</label>
                                <select id="genero" name="genero" value={editPerfil.genero || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50">
                                    <option value="">Seleccionar</option>
                                    <option>Masculino</option>
                                    <option>Femenino</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="fecha_nacimiento" className="block text-sm mb-1">Fecha de nacimiento</label>
                                <input id="fecha_nacimiento" type="date" name="fecha_nacimiento" value={editPerfil.fecha_nacimiento?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" />
                            </div>
                            <div>
                                <label htmlFor="ciudad" className="block text-sm mb-1 capitalize">Ciudad</label>
                                <input id="ciudad" name="ciudad" value={editPerfil.ciudad || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu ciudad" />
                            </div>
                            <div>
                                <label htmlFor="pais" className="block text-sm mb-1 capitalize">País</label>
                                <input id="pais" name="pais" value={editPerfil.pais || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu país" />
                            </div>
                            <div>
                                <label htmlFor="objetivo" className="block text-sm mb-1 capitalize">Objetivo</label>
                                <input id="objetivo" name="objetivo" value={editPerfil.objetivo || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu objetivo principal" />
                            </div>
                            <div>
                                <label htmlFor="nivel" className="block text-sm mb-1 capitalize">Nivel</label>
                                <input id="nivel" name="nivel" value={editPerfil.nivel || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu nivel de experiencia" />
                            </div>
                            <div>
                                <label htmlFor="biografia" className="block text-sm mb-1 capitalize">Biografía</label>
                                <textarea id="biografia" name="biografia" value={editPerfil.biografia || ''} onChange={handleChange} rows="3" className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Cuéntanos sobre ti..."></textarea>
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm mb-1">Email</label>
                                <input id="email" type="email" value={email} disabled className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed" />
                            </div>
                        </div>

                        {error && <p className="bg-red-900/20 text-red-400 p-3 rounded-lg text-center font-medium animate-pulse">{error}</p>}
                        {success && <p className="bg-green-900/20 text-green-400 p-3 rounded-lg text-center font-medium animate-pulse">{success}</p>}

                        <button type="submit" disabled={saving} className="w-full flex justify-center items-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-600/50">
                            {saving ? 'Guardando...' : <><FaSave className="mr-2" />Guardar Cambios</>}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-gray-800 text-white font-sans p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
                            <p className="text-sm text-gray-400">{user?.email}</p>
                        </div>
                        <button 
                            onClick={handleEditProfile}
                            className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-700 transition-colors"
                        >
                            <FaEdit className="text-white" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Avatar y nombre */}
                        <div className="flex flex-col items-center bg-gray-700 rounded-xl p-6 shadow-lg">
                            {perfil.avatar_url ? (
                                <img src={perfil.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-cyan-500 shadow-md" />
                            ) : (
                                <FaUserCircle className="text-6xl text-blue-400 mb-2" />
                            )}
                            <h2 className="text-2xl font-bold text-white mt-4">{perfil.nombre} {perfil.apellido}</h2>
                        </div>

                        {/* Información Personal */}
                        <div className="bg-gray-700 rounded-xl p-4 shadow-lg">
                            <h3 className="text-lg font-bold text-white mb-3">Información Personal</h3>
                            <div className="space-y-3">
                                <InfoRow icon={<FaBirthdayCake />} label="Edad" value={perfil.edad ? `${perfil.edad} años` : null} />
                                <InfoRow icon={<FaTransgender />} label="Género" value={perfil.genero} />
                                <InfoRow icon={<FaPhone />} label="Teléfono" value={perfil.telefono} />
                                <InfoRow icon={<FaMapMarkerAlt />} label="Ubicación" value={perfil.ciudad && perfil.pais ? `${perfil.ciudad}, ${perfil.pais}` : perfil.ciudad || perfil.pais} />
                            </div>
                        </div>

                        {/* Objetivos y Nivel */}
                        <div className="bg-gray-700 rounded-xl p-4 shadow-lg">
                            <h3 className="text-lg font-bold text-white mb-3">Objetivos y Nivel</h3>
                            <div className="space-y-3">
                                <InfoRow icon={<FaBullseye />} label="Objetivo" value={perfil.objetivo} />
                                <InfoRow icon={<FaChartLine />} label="Nivel" value={perfil.nivel} />
                            </div>
                        </div>

                        {/* Biografía */}
                        {perfil.biografia && (
                            <div className="bg-gray-700 rounded-xl p-4 shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-3">Biografía</h3>
                                <InfoRow icon={<FaBook />} value={perfil.biografia} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default PerfilDrawer;
