import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useRouter } from 'react-router-dom';

export function BottomSheet({ isOpen, onClose, children }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <motion.div
        className="fixed inset-0 bg-black/30"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-end">
        <Dialog.Panel
          as={motion.div}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          onDragEnd={(event, info) => {
            if (info.offset.y > 200) {
              onClose();
            }
          }}
          className="w-full max-w-md mx-auto bg-gray-800 rounded-t-2xl shadow-lg"
        >
          <div className="p-4">
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4" />
          </div>
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}