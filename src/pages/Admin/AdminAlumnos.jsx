import AlumnosManager from '../../components/AlumnosManager';
import { AnimatedLayout } from '../../components/animations';
import { FaUsers } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminAlumnos = () => {
    return (
        <AnimatedLayout className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-safe">

            <AlumnosManager />
        </AnimatedLayout>
    );
};

export default AdminAlumnos;
