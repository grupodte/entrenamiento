import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
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

            setSuccess('Perfil actualizado correctamente');
        } catch (err) {
            console.error(err);
            setError('Error al guardar cambios');
        } finally {
            setSaving(false);
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
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
            <main className="flex-grow max-w-xl mx-auto w-full pt-safe">
                <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 rounded p-6 shadow">
                    <div className="flex flex-col items-center">
                        {preview ? <img src={preview} alt="avatar" className="w-24 h-24 rounded-full object-cover mb-2" /> : <FaUserCircle className="text-6xl mb-2 text-blue-400" />}
                        <label className="text-sm cursor-pointer hover:underline">Cambiar foto<input type="file" className="hidden" onChange={handleFileChange} /></label>
                    </div>
                    {['nombre', 'apellido', 'edad', 'objetivo', 'nivel', 'telefono', 'biografia', 'ciudad', 'pais'].map(campo => (
                        <div key={campo}><label className="block text-sm mb-1 capitalize">{campo}</label><input name={campo} value={perfil[campo] || ''} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600" /></div>
                    ))}
                    <div><label className="block text-sm mb-1">Género</label><select name="genero" value={perfil.genero || ''} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"><option value="">Seleccionar</option><option>Masculino</option><option>Femenino</option><option>Otro</option></select></div>
                    <div><label className="block text-sm mb-1">Fecha de nacimiento</label><input type="date" name="fecha_nacimiento" value={perfil.fecha_nacimiento?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600" /></div>
                    <div><label className="block text-sm mb-1">Email</label><input type="email" value={email} disabled className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-gray-400" /></div>
                    {error && <p className="bg-red-900/20 text-red-400 p-2 rounded">{error}</p>}
                    {success && <p className="bg-green-900/20 text-green-400 p-2 rounded">{success}</p>}
                    <button type="submit" disabled={saving} className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded">{saving ? 'Guardando...' : <><FaSave className="mr-2" />Guardar</>}</button>
                </form>
            </main>
        </div>
    );
};

export default PerfilPage;
