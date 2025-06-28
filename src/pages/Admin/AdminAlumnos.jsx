// Se elimina la importación de AdminLayout ya que no se usa aquí directamente
import AlumnosManager from '../../components/AlumnosManager';

const AdminAlumnos = () => {
    return (
        // Ya no se envuelve con <AdminLayout>
        <div className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-[calc(4rem+env(safe-area-inset-bottom))]">
            <AlumnosManager />
        </div>
    );
};

export default AdminAlumnos;
