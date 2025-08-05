// src/components/Drawer.jsx
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';

const Drawer = ({ isOpen, onClose, children }) => {
    const drawerContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        drag="y"
                        onDragEnd={(e, info) => info.offset.y > 100 && onClose()}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                        className="
                            fixed bottom-0 left-0 right-0 
                            max-h-[90vh] 
                            bg-gray-900/95 
                            text-white 
                            shadow-2xl 
                            z-[9999] 
                            rounded-t-2xl 
                            overflow-y-auto 
                            overscroll-contain
                            backdrop-blur-md
                            pb-safe
                        "
                    >
                        {/* Handle para arrastrar */}
                        <div className="w-full flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-gray-500 rounded-full" />
                        </div>

                        {/* Contenido */}
                        <div className="px-4 pb-6">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(drawerContent, document.body);
};

export default Drawer;
