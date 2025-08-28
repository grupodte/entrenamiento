import ShinyText from './ShinyText';

const ShinyTextExample = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-8 p-8">
            <h1 className="text-4xl font-bold text-white mb-8">Ejemplos de ShinyText</h1>
            
            {/* Ejemplo básico */}
            <div className="space-y-4">
                <h2 className="text-xl text-gray-400 mb-2">Básico:</h2>
                <ShinyText text="Texto brillante con animación" />
            </div>
            
            {/* Ejemplo con velocidad personalizada */}
            <div className="space-y-4">
                <h2 className="text-xl text-gray-400 mb-2">Velocidad rápida (2s):</h2>
                <ShinyText text="Animación más rápida" speed={2} />
            </div>
            
            {/* Ejemplo con velocidad lenta */}
            <div className="space-y-4">
                <h2 className="text-xl text-gray-400 mb-2">Velocidad lenta (10s):</h2>
                <ShinyText text="Animación más lenta" speed={10} />
            </div>
            
            {/* Ejemplo deshabilitado */}
            <div className="space-y-4">
                <h2 className="text-xl text-gray-400 mb-2">Deshabilitado:</h2>
                <ShinyText text="Sin animación" disabled={true} />
            </div>
            
            {/* Ejemplo con clases personalizadas */}
            <div className="space-y-4">
                <h2 className="text-xl text-gray-400 mb-2">Con clases personalizadas:</h2>
                <ShinyText 
                    text="Texto grande y brillante" 
                    className="text-4xl font-bold"
                />
            </div>
            
            {/* Múltiples instancias */}
            <div className="space-y-4">
                <h2 className="text-xl text-gray-400 mb-2">Múltiples instancias:</h2>
                <div className="flex gap-4 flex-wrap">
                    <ShinyText text="Primero" speed={3} />
                    <ShinyText text="Segundo" speed={4} />
                    <ShinyText text="Tercero" speed={5} />
                    <ShinyText text="Cuarto" speed={6} />
                </div>
            </div>
        </div>
    );
};

export default ShinyTextExample;
