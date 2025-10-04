import React, { useState } from 'react';
import Drawer from '../components/Drawer';

const TestDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-white text-2xl mb-4">Test Drawer Full Screen</h1>
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
                >
                    Abrir Drawer
                </button>
                
                <div className="mt-4 text-gray-400 text-sm">
                    <p>PWA Instalada: {window.matchMedia('(display-mode: standalone)').matches ? 'Sí' : 'No'}</p>
                    <p>Dimensiones: {window.innerWidth} x {window.innerHeight}</p>
                    <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
                </div>
            </div>

            <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <div className="h-full flex flex-col bg-white text-black p-6">
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <h2 className="text-2xl font-bold mb-4">Drawer Full Screen Test</h2>
                        <p className="text-center mb-4">
                            Este drawer debería cubrir toda la pantalla tanto en PWA como en navegador web.
                        </p>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>PWA: {window.matchMedia('(display-mode: standalone)').matches ? 'Sí' : 'No'}</p>
                            <p>Window: {window.innerWidth} x {window.innerHeight}</p>
                            <p>Screen: {screen.width} x {screen.height}</p>
                        </div>
                        
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="mt-8 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg"
                        >
                            Cerrar Drawer
                        </button>
                    </div>
                </div>
            </Drawer>
        </div>
    );
};

export default TestDrawer;
