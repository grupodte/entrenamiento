import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { FaArrowLeft, FaSave, FaUserCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Drawer from '../../components/Drawer';

const EditarPerfilDrawer = ({ isOpen, onClose, onBack, onProfileUpdate }) => {
    const { user } = useAuth();

    const [perfil, setPerfil] = useState({ nombre: '', apellido: '', edad: '', objetivo: '', nivel: '',  telefono: '', genero: '', fecha_nacimiento: '', biografia: '', ciudad: '', pais: '', avatar_url: '' });
    const [email, setEmail] = useState('');
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isMoreInfoOpen, setIsMoreInfoOpen] = useState(false);

    useEffect(() => {
        if (!isOpen || !user) return;
        setEmail(user.email);
        const fetchPerfil = async () => {
            setLoading(true);
            const { data, error: err } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
            if (err) { console.error(err); setError('No se pudo cargar el perfil'); }
            else { setPerfil(prev => ({ ...prev, ...data })); setPreview(data.avatar_url || ''); }
            setLoading(false);
        };
        fetchPerfil();
    }, [isOpen, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPerfil(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPerfil(prev => ({ ...prev, avatarFile: file }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            let avatar_url = perfil.avatar_url;

            if (perfil.avatarFile) {
                const ext = perfil.avatarFile.name.split('.').pop();
                const fileName = `${user.id}_${Date.now()}.${ext}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, perfil.avatarFile);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatar_url = publicUrlData.publicUrl;
            }

            const { error: updateError } = await supabase
                .from('perfiles')
                .update({
                    nombre: perfil.nombre,
                    apellido: perfil.apellido,
                    edad: perfil.edad ? parseInt(perfil.edad) : null,
                    objetivo: perfil.objetivo,
                    nivel: perfil.nivel,
                    telefono: perfil.telefono,
                    genero: perfil.genero,
                    fecha_nacimiento: perfil.fecha_nacimiento,
                    biografia: perfil.biografia,
                    ciudad: perfil.ciudad,
                    pais: perfil.pais,
                    avatar_url: avatar_url
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setPerfil(prev => ({ ...prev, avatar_url: avatar_url, avatarFile: undefined }));
            setPreview(avatar_url);
            setSuccess('Perfil actualizado correctamente');
            if(onProfileUpdate) onProfileUpdate();
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(`Error al guardar cambios: ${err.message || err}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            <div className="bg-gray-800 text-white p-4 rounded-t-2xl flex flex-col h-full">
                <div className="flex-shrink-0 flex items-center justify-between mb-4">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700"><FaArrowLeft /></button>
                    <h1 className="text-lg font-bold">Editar Perfil</h1>
                    <div />
                </div>
                {loading ? (
                    <div className="flex-grow flex justify-center items-center">Cargando...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                            <div className="flex flex-col items-center">
                                {preview ? <img src={preview} alt="avatar" className="w-20 h-20 rounded-full border-2 border-cyan-500" /> : <FaUserCircle className="text-6xl text-blue-400" />}
                                <label className="mt-2 text-sm text-cyan-400 cursor-pointer hover:underline">
                                    Cambiar foto
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input name="nombre" value={perfil.nombre || ''} onChange={handleChange} placeholder="Nombre" className="p-2 rounded bg-gray-700" />
                                <input name="apellido" value={perfil.apellido || ''} onChange={handleChange} placeholder="Apellido" className="p-2 rounded bg-gray-700" />
                                <input name="edad" type="number" value={perfil.edad || ''} onChange={handleChange} placeholder="Edad" className="p-2 rounded bg-gray-700" />
                                <input name="telefono" value={perfil.telefono || ''} onChange={handleChange} placeholder="Teléfono" className="p-2 rounded bg-gray-700" />
                                <input name="ciudad" value={perfil.ciudad || ''} onChange={handleChange} placeholder="Ciudad" className="p-2 rounded bg-gray-700 col-span-2" />
                                <input name="pais" value={perfil.pais || ''} onChange={handleChange} placeholder="País" className="p-2 rounded bg-gray-700 col-span-2" />
                            </div>

                            <button type="button" onClick={() => setIsMoreInfoOpen(!isMoreInfoOpen)} className="w-full flex justify-between items-center p-2 rounded bg-gray-700 hover:bg-gray-600">
                                <span>Más información</span>
                                {isMoreInfoOpen ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {isMoreInfoOpen && (
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <input name="objetivo" value={perfil.objetivo || ''} onChange={handleChange} placeholder="Objetivo" className="p-2 rounded bg-gray-700 col-span-2" />
                                    <input name="nivel" value={perfil.nivel || ''} onChange={handleChange} placeholder="Nivel" className="p-2 rounded bg-gray-700 col-span-2" />
                                    <select name="genero" value={perfil.genero || ''} onChange={handleChange} className="p-2 rounded bg-gray-700 col-span-2">
                                        <option value="">Seleccionar Género</option>
                                        <option>Masculino</option>
                                        <option>Femenino</option>
                                        <option>Otro</option>
                                    </select>
                                    <input name="fecha_nacimiento" type="date" value={perfil.fecha_nacimiento?.split('T')[0] || ''} onChange={handleChange} placeholder="Fecha de Nacimiento" className="p-2 rounded bg-gray-700 col-span-2" />
                                    <textarea name="biografia" value={perfil.biografia || ''} onChange={handleChange} placeholder="Biografía" className="p-2 rounded bg-gray-700 col-span-2" rows="3"></textarea>
                                </div>
                            )}
                        </div>
                        <div className="flex-shrink-0 pt-4">
                            {error && <p className="bg-red-900/20 text-red-400 p-2 rounded mb-2">{error}</p>}
                            {success && <p className="bg-green-900/20 text-green-400 p-2 rounded mb-2">{success}</p>}
                            <button type="submit" disabled={saving} className="w-full py-2 bg-cyan-600 rounded hover:bg-cyan-700">{saving ? 'Guardando...' : <><FaSave className="inline mr-1" /> Guardar</>}</button>
                        </div>
                    </form>
                )}
            </div>
        </Drawer>
    );
};

export default EditarPerfilDrawer;
