// src/pages/Admin/AdminRutinas.jsx
import RutinasManager from '../../components/RutinasManager';

const AdminRutinas = () => {
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-[calc(4rem+env(safe-area-inset-bottom))]">
                <RutinasManager />
            </div>
    );
};

export default AdminRutinas;
