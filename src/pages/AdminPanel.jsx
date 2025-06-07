import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import AdminBottomNav from '../components/AdminBottomNav';

const AdminPanel = () => {
    const [alumnos, setAlumnos] = useState([]);
    const [rutinas, setRutinas] = useState([]);
    const [activeTab, setActiveTab] = useState('alumnos');
    const [nuevaRutina, setNuevaRutina] = useState({ nombre: '', descripcion: '', video_url: '' });

    const fetchAlumnos = async () => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('id, rol, nombre, apellido, email')
            .eq('rol', 'alumno');

        if (error) {
            console.error('Error al cargar alumnos:', error);
        } else {
            setAlumnos(data);
        }
    };

    const fetchRutinas = async () => {
        const { data, error } = await supabase.from('rutinas').select('*');

        if (error) {
            console.error('Error al cargar rutinas:', error);
        } else {
            setRutinas(data);
        }
    };

    const crearRutina = async (e) => {
        e.preventDefault();
        const user = (await supabase.auth.getUser()).data.user;

        const { error } = await supabase
            .from('rutinas')
            .insert([{ ...nuevaRutina, creador_id: user.id }]);

        if (error) {
            alert('Error al crear rutina');
        } else {
            setNuevaRutina({ nombre: '', descripcion: '', video_url: '' });
            fetchRutinas();
        }
    };

    useEffect(() => {
        fetchAlumnos();
        fetchRutinas();
    }, []);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
            {/* Sidebar (solo en desktop) */}
            <aside className="hidden md:block md:w-64 bg-white shadow-md border-r p-4 sticky top-0 h-screen">
                <h2 className="text-xl font-bold mb-6">Panel de Entrenador</h2>
                <nav className="flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('alumnos')}
                        className={`text-left px-4 py-2 rounded ${activeTab === 'alumnos' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                    >
                        👥 Alumnos
                    </button>
                    <button
                        onClick={() => setActiveTab('rutinas')}
                        className={`text-left px-4 py-2 rounded ${activeTab === 'rutinas' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                    >
                        📋 Rutinas
                    </button>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-6 md:p-10">
                {activeTab === 'alumnos' && (
                    <>
                        <h1 className="text-2xl font-bold mb-4">Alumnos</h1>
                        {alumnos.length === 0 ? (
                            <p>No hay alumnos registrados.</p>
                        ) : (
                            <ul className="space-y-4">
                                {alumnos.map((alumno) => (
                                    <li key={alumno.id} className="p-4 border bg-white rounded-lg shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{alumno.nombre} {alumno.apellido}</p>
                                            <p className="text-sm text-gray-500">{alumno.email}</p>
                                        </div>
                                        <Link
                                            to={`/alumno/${alumno.id}`}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                        >
                                            Ver Perfil
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}

                {activeTab === 'rutinas' && (
                    <>
                        <h1 className="text-2xl font-bold mb-6">Rutinas</h1>

                        {/* Formulario para nueva rutina */}
                        <form onSubmit={crearRutina} className="bg-white p-4 border rounded-lg shadow-md mb-6">
                            <h3 className="text-lg font-semibold mb-2">Crear nueva rutina</h3>
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={nuevaRutina.nombre}
                                onChange={(e) => setNuevaRutina({ ...nuevaRutina, nombre: e.target.value })}
                                className="w-full mb-2 border rounded px-3 py-2"
                                required
                            />
                            <textarea
                                placeholder="Descripción"
                                value={nuevaRutina.descripcion}
                                onChange={(e) => setNuevaRutina({ ...nuevaRutina, descripcion: e.target.value })}
                                className="w-full mb-2 border rounded px-3 py-2"
                            />
                            <input
                                type="url"
                                placeholder="URL de video (opcional)"
                                value={nuevaRutina.video_url}
                                onChange={(e) => setNuevaRutina({ ...nuevaRutina, video_url: e.target.value })}
                                className="w-full mb-2 border rounded px-3 py-2"
                            />
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Guardar rutina
                            </button>
                        </form>

                        {/* Lista de rutinas */}
                        <ul className="space-y-4">
                            {rutinas.map((rutina) => (
                                <li key={rutina.id} className="p-4 border rounded bg-white shadow-sm">
                                    <h4 className="font-bold text-lg">{rutina.nombre}</h4>
                                    <p className="text-sm text-gray-600">{rutina.descripcion}</p>
                                    {rutina.video_url && (
                                        <a href={rutina.video_url} target="_blank" className="text-blue-500 text-sm underline">
                                            Ver video
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </main>

            {/* Bottom Navigation en mobile */}
            <AdminBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
};

export default AdminPanel;
