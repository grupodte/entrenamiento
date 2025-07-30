import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaUserCircle } from 'react-icons/fa';

const PerfilPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [perfil, setPerfil] = useState({ nombre: '', apellido: '', edad: '', objetivo: '', nivel: '',  telefono: '', genero: '', fecha_nacimiento: '', biografia: '', ciudad: '', pais: '', avatar_url: '' });
    const [email, setEmail] = useState('');
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        setEmail(user.email);
        const fetchPerfil = async () => {
            setLoading(true);
            const { data, error: err } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
            if (err) { console.error(err); setError('No se pudo cargar el perfil'); }
            else { setPerfil(prev => ({ ...prev, ...data })); setPreview(data.avatar_url || ''); }
            setLoading(false);
        };
        fetchPerfil();
    }, [user]);

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
                const fileName = `${user.id}_${Date.now()}.${ext}`;  // nombre único
                const filePath = `avatars/${fileName}`;

                // opcionalmente podrías limpiar archivos viejos si quieres
                // await supabase.storage.from('avatars').remove([oldPath])

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, perfil.avatarFile);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatar_url = publicUrlData.publicUrl;
            }

            const { error: updateError } = 
                await supabase
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

            // Update local state with new avatar_url and clear avatarFile
            setPerfil(prev => ({ ...prev, avatar_url: avatar_url, avatarFile: undefined }));
            setPreview(avatar_url);

            setSuccess('Perfil actualizado correctamente');
        } catch (err) {
            console.error(err);
            setError(`Error al guardar cambios: ${err.message || err}`);
        } finally {
            setSaving(false);
            // Keep messages visible for a bit longer or until user interaction
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000); // Increased timeout to 5 seconds
        }
    };
    

    if (loading) return <div className="flex justify-center items-center min-h-screen text-white">Cargando perfil...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
            <header className="sticky top-0 bg-gray-900/80 backdrop-blur-lg z-20 p-4 flex items-center gap-4 border-b border-gray-800">
                <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">Editar Perfil</h1>
                </div>
            </header>
            <main className="flex-grow max-w-xl mx-auto w-full pt-safe p-4">
                <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex flex-col items-center mb-6">
                        {preview ? <img src={preview} alt="avatar" className="w-28 h-28 rounded-full object-cover border-4 border-cyan-500 shadow-md" /> : <FaUserCircle className="text-7xl mb-2 text-blue-400" />}
                        <label className="mt-3 text-sm text-cyan-400 cursor-pointer hover:underline font-medium">Cambiar foto<input type="file" className="hidden" onChange={handleFileChange} accept="image/*" /></label>
                    </div>

                    {/* Personal Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nombre" className="block text-sm mb-1 capitalize">Nombre</label>
                            <input id="nombre" name="nombre" value={perfil.nombre || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu nombre" />
                        </div>
                        <div>
                            <label htmlFor="apellido" className="block text-sm mb-1 capitalize">Apellido</label>
                            <input id="apellido" name="apellido" value={perfil.apellido || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu apellido" />
                        </div>
                        <div>
                            <label htmlFor="edad" className="block text-sm mb-1 capitalize">Edad</label>
                            <input id="edad" type="number" name="edad" value={perfil.edad || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu edad" />
                        </div>
                        <div>
                            <label htmlFor="telefono" className="block text-sm mb-1 capitalize">Teléfono</label>
                            <input id="telefono" type="tel" name="telefono" value={perfil.telefono || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu teléfono" />
                        </div>
                        <div>
                            <label htmlFor="genero" className="block text-sm mb-1">Género</label>
                            <select id="genero" name="genero" value={perfil.genero || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50">
                                <option value="">Seleccionar</option>
                                <option>Masculino</option>
                                <option>Femenino</option>
                                <option>Otro</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="fecha_nacimiento" className="block text-sm mb-1">Fecha de nacimiento</label>
                            <input id="fecha_nacimiento" type="date" name="fecha_nacimiento" value={perfil.fecha_nacimiento?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" />
                        </div>
                    </div>

                    {/* Location Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="ciudad" className="block text-sm mb-1 capitalize">Ciudad</label>
                            <input id="ciudad" name="ciudad" value={perfil.ciudad || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu ciudad" />
                        </div>
                        <div>
                            <label htmlFor="pais" className="block text-sm mb-1 capitalize">País</label>
                            <input id="pais" name="pais" value={perfil.pais || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu país" />
                        </div>
                    </div>

                    {/* Goals and Level Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="objetivo" className="block text-sm mb-1 capitalize">Objetivo</label>
                            <input id="objetivo" name="objetivo" value={perfil.objetivo || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu objetivo principal" />
                        </div>
                        <div>
                            <label htmlFor="nivel" className="block text-sm mb-1 capitalize">Nivel</label>
                            <input id="nivel" name="nivel" value={perfil.nivel || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Tu nivel de experiencia" />
                        </div>
                    </div>

                    {/* Biography and Email */}
                    <div>
                        <label htmlFor="biografia" className="block text-sm mb-1 capitalize">Biografía</label>
                        <textarea id="biografia" name="biografia" value={perfil.biografia || ''} onChange={handleChange} rows="3" className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500 focus:ring-opacity-50" placeholder="Cuéntanos sobre ti..."></textarea>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm mb-1">Email</label>
                        <input id="email" type="email" value={email} disabled className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed" />
                    </div>

                    {error && <p className="bg-red-900/20 text-red-400 p-3 rounded-lg text-center font-medium animate-pulse">{error}</p>}
                    {success && <p className="bg-green-900/20 text-green-400 p-3 rounded-lg text-center font-medium animate-pulse">{success}</p>}

                    <button type="submit" disabled={saving} className="w-full flex justify-center items-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-600/50">
                        {saving ? 'Guardando...' : <><FaSave className="mr-2" />Guardar Cambios</>}
                    </button>
                </form>
            </main>
        </div>
    );
};

export default PerfilPage;
