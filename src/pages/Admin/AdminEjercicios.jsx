import EjerciciosManager from '../../components/AgregarEjercicio';
import { AnimatedLayout } from '../../components/animations';

/**
 * @file AdminEjercicios.jsx
 * @description This page serves as the main entry point for managing exercises.
 * It acts as a layout wrapper for the `EjerciciosManager` component, which contains
 * all the core logic for creating, listing, filtering, and managing exercises.
 * The component is aliased as `EjerciciosManager` from `../../components/AgregarEjercicio.jsx`
 * for historical reasons, but it handles the full management lifecycle.
 */

const AdminEjercicios = () => {
    return (
        <AnimatedLayout className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-safe">
            <EjerciciosManager />
        </AnimatedLayout>
    );
};

export default AdminEjercicios;
