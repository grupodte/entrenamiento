import AdminLayout from '../../layouts/AdminLayout';
import EjerciciosManager from '../../components/AgregarEjercicio';
import { FaDumbbell } from 'react-icons/fa';

const AdminEjercicios = () => {
    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto mt-10 mb-10 p-4 rounded-2xl shadow-ios backdrop-blur-lg border border-white/10 bg-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <FaDumbbell className="text-3xl text-ios-secondary drop-shadow-sm" />
                    <h1 className="text-ios-title text-white">Gestión de Ejercicios</h1>
                </div>

                <p className="text-ios-body text-white/70 mb-6">
                    Aquí podés crear, editar y administrar todos los ejercicios disponibles en la plataforma.
                </p>

                <EjerciciosManager />
            </div>
    <div className='h-[120px]'>
    </div>
         </AdminLayout>
    );
};

export default AdminEjercicios;
