import EjerciciosManager from '../../components/AgregarEjercicio';
import { FaDumbbell } from 'react-icons/fa';

const AdminEjercicios = () => {
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-[calc(4rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3 mb-6">
                    <FaDumbbell className="text-3xl text-ios-secondary drop-shadow-sm" />
                    <h1 className="text-ios-title text-white">Gestión de Ejercicios</h1>
                </div>

                <p className="text-ios-body text-white/70 mb-6">
                    Aquí podés crear, editar y administrar todos los ejercicios disponibles en la plataforma.
                </p>

                <EjerciciosManager />
            </div>
    );
};

export default AdminEjercicios;
