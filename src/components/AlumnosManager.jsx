import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

const AlumnosManager = () => {
    const [alumnos, setAlumnos] = useState([]);

    const fetchAlumnos = async () => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('id, rol, nombre, apellido, email')
            .eq('rol', 'alumno');

        if (!error) setAlumnos(data);
    };

    useEffect(() => {
        fetchAlumnos();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Alumnos</h1>
            {alumnos.length === 0 ? (
                <p>No hay alumnos registrados.</p>
            ) : (
                <ul className="space-y-4">
                    {alumnos.map((alumno) => (
                        <li
                            key={alumno.id}
                            className="p-4 border bg-white rounded-lg shadow-sm flex justify-between items-center"
                        >
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
        </div>
    );
};

export default AlumnosManager;
