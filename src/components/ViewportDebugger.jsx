// src/components/ViewportDebugger.jsx
import React, { useState, useEffect } from 'react';

const ViewportDebugger = ({ position = 'top-right' }) => {
    const [viewportData, setViewportData] = useState({});
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const updateViewportData = () => {
            const computedStyle = getComputedStyle(document.documentElement);
            
            setViewportData({
                // Dimensiones actuales
                windowInnerHeight: window.innerHeight,
                windowInnerWidth: window.innerWidth,
                screenHeight: screen.height,
                screenWidth: screen.width,
                
                // Variables CSS dinámicas
                vh: computedStyle.getPropertyValue('--vh'),
                fullVh: computedStyle.getPropertyValue('--full-vh'),
                realVh: computedStyle.getPropertyValue('--real-vh'),
                viewportHeight: computedStyle.getPropertyValue('--viewport-height'),
                safeViewportHeight: computedStyle.getPropertyValue('--safe-viewport-height'),
                
                // Safe areas
                safeAreaTop: computedStyle.getPropertyValue('--sat'),
                safeAreaBottom: computedStyle.getPropertyValue('--sab'),
                
                // Estado del navegador
                isStandalone: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone,
                isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                userAgent: navigator.userAgent.substring(0, 30) + '...',
                
                // Timestamp
                timestamp: new Date().toLocaleTimeString()
            });
        };

        // Actualizar inmediatamente
        updateViewportData();

        // Listeners
        const events = ['resize', 'orientationchange', 'scroll'];
        events.forEach(event => {
            window.addEventListener(event, updateViewportData, { passive: true });
        });

        // Actualización periódica para capturar cambios sutiles
        const interval = setInterval(updateViewportData, 1000);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateViewportData);
            });
            clearInterval(interval);
        };
    }, []);

    const positionClasses = {
        'top-right': 'fixed top-4 right-4 z-[99999]',
        'top-left': 'fixed top-4 left-4 z-[99999]',
        'bottom-right': 'fixed bottom-4 right-4 z-[99999]',
        'bottom-left': 'fixed bottom-4 left-4 z-[99999]'
    };

    return (
        <div className={positionClasses[position]}>
            {/* Botón toggle */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="
                    bg-red-600 hover:bg-red-700 text-white 
                    px-3 py-2 rounded-lg text-xs font-mono
                    shadow-lg transition-colors
                "
                title="Debug Viewport"
            >
                {isVisible ? 'Hide' : 'Debug'}
            </button>

            {/* Panel de información */}
            {isVisible && (
                <div className="
                    mt-2 bg-black/90 text-white p-3 rounded-lg 
                    font-mono text-xs max-w-sm
                    backdrop-blur-sm border border-gray-600
                    max-h-96 overflow-y-auto scrollbar-hide
                ">
                    <div className="mb-2 text-yellow-400 font-bold">
                        Viewport Debug Info
                    </div>
                    
                    <div className="space-y-1">
                        <div className="text-blue-300 font-semibold">Browser:</div>
                        <div>Height: {viewportData.windowInnerHeight}px</div>
                        <div>Width: {viewportData.windowInnerWidth}px</div>
                        <div>Mobile: {viewportData.isMobile ? '✅' : '❌'}</div>
                        <div>PWA: {viewportData.isStandalone ? '✅' : '❌'}</div>
                        
                        <div className="text-green-300 font-semibold mt-2">CSS Variables:</div>
                        <div>--vh: {viewportData.vh}</div>
                        <div>--full-vh: {viewportData.fullVh}</div>
                        <div>--real-vh: {viewportData.realVh}</div>
                        <div>--viewport-height: {viewportData.viewportHeight}</div>
                        <div className="text-yellow-300">--safe-viewport-height: {viewportData.safeViewportHeight}</div>
                        
                        <div className="text-purple-300 font-semibold mt-2">Safe Areas:</div>
                        <div>Top: {viewportData.safeAreaTop}</div>
                        <div>Bottom: {viewportData.safeAreaBottom}</div>
                        
                        <div className="text-gray-400 mt-2 text-xs">
                            Last update: {viewportData.timestamp}
                        </div>
                        
                        <div className="text-gray-500 mt-2 text-xs break-all">
                            UA: {viewportData.userAgent}
                        </div>
                    </div>

                    {/* Indicadores visuales */}
                    <div className="mt-3 space-y-1">
                        <div className="text-cyan-300 font-semibold">Height Comparison:</div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded"></div>
                            <span className="text-xs">Inner: {viewportData.windowInnerHeight}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded"></div>
                            <span className="text-xs">Safe: {parseInt(viewportData.safeViewportHeight) || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded"></div>
                            <span className="text-xs">Diff: {viewportData.windowInnerHeight - (parseInt(viewportData.safeViewportHeight) || 0)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewportDebugger;
