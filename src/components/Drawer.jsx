// src/components/Drawer.jsx
import { motion, AnimatePresence } from 'framer-motion';

const Drawer = ({ isOpen, onClose, children }) => {
    const handleDragEnd = (event, info) => {
        // If dragged down by more than 100px, close the drawer
        if (info.offset.y > 100) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Background Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 z-[998]"
                        onClick={onClose}
                    />
                    {/* Drawer Content */}
                    <motion.div
                        drag="y"
                        onDragEnd={handleDragEnd}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }} // Allows some bounce when dragging down
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-0 left-0 w-full max-h-[90vh] bg-gray-800 text-white shadow-lg z-[999] rounded-t-2xl overflow-y-auto"
                    >
                        {/* Drag Handle Indicator */}
                        <div className="w-full flex justify-center py-2">
                            <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
                        </div>
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Drawer;