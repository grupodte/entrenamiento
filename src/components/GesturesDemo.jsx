import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag, useGesture } from '@use-gesture/react';

/**
 * Componente de demostración de gestos fluidos para PWA
 * Implementa interacciones nativas como swipe, drag y pinch-to-zoom
 */

// 1. Tarjeta arrastrable (para reordenar ejercicios)
export const DraggableCard = ({ children, onSwipeLeft, onSwipeRight, ...props }) => {
  const [{ x, rotateZ, scale }, api] = useSpring(() => ({
    x: 0,
    rotateZ: 0,
    scale: 1,
    config: { mass: 1, tension: 350, friction: 40 }
  }));

  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      // Determinar si es un swipe decisivo
      const trigger = Math.abs(vx) > 0.2 && Math.abs(mx) > 100;
      
      if (!active && trigger) {
        // Swipe completo
        const isSwipeLeft = xDir < 0;
        
        api.start({
          x: isSwipeLeft ? -300 : 300,
          rotateZ: isSwipeLeft ? -15 : 15,
          scale: 0.8,
          config: { mass: 1, tension: 200, friction: 25 }
        });
        
        // Ejecutar callback después de la animación
        setTimeout(() => {
          if (isSwipeLeft) {
            onSwipeLeft?.();
          } else {
            onSwipeRight?.();
          }
          // Reset
          api.start({ x: 0, rotateZ: 0, scale: 1 });
        }, 200);
      } else {
        // Arrastre en progreso
        api.start({
          x: active ? mx : 0,
          rotateZ: active ? mx / 10 : 0,
          scale: active ? 1.05 : 1,
          immediate: name => active && name === 'x'
        });
      }
    },
    {
      bounds: { left: -200, right: 200 },
      rubberband: true
    }
  );

  return (
    <animated.div
      {...bind()}
      {...props}
      className="touch-none select-none cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotateZ,
        scale,
        ...props.style
      }}
    >
      {children}
    </animated.div>
  );
};

// 2. Carrusel con swipe horizontal (para galería de ejercicios)
export const SwipeCarousel = ({ items, currentIndex = 0, onIndexChange }) => {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      if (!active) {
        const trigger = Math.abs(vx) > 0.3 || Math.abs(mx) > 80;
        
        if (trigger && xDir < 0 && currentIndex < items.length - 1) {
          // Swipe left - siguiente
          onIndexChange?.(currentIndex + 1);
        } else if (trigger && xDir > 0 && currentIndex > 0) {
          // Swipe right - anterior
          onIndexChange?.(currentIndex - 1);
        }
        
        // Reset position
        api.start({ x: 0 });
      } else {
        // Seguir el dedo durante el arrastre
        api.start({ x: mx, immediate: true });
      }
    },
    {
      bounds: { left: -100, right: 100 },
      rubberband: true
    }
  );

  return (
    <div className="relative overflow-hidden">
      <animated.div
        {...bind()}
        style={{ x }}
        className="flex touch-none"
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {item}
          </div>
        ))}
      </animated.div>
    </div>
  );
};

// 3. Zoom y Pan para imágenes (útil para diagramas de ejercicios)
export const ZoomableImage = ({ src, alt, ...props }) => {
  const [{ scale, x, y }, api] = useSpring(() => ({
    scale: 1,
    x: 0,
    y: 0,
    config: { mass: 1, tension: 350, friction: 40 }
  }));

  const bind = useGesture(
    {
      onPinch: ({ offset: [scale] }) => {
        api.start({ scale: Math.max(0.5, Math.min(3, scale)) });
      },
      onDrag: ({ offset: [x, y], pinching }) => {
        if (!pinching) {
          api.start({ x, y });
        }
      },
      onDoubleClick: () => {
        // Double tap para reset
        api.start({ scale: 1, x: 0, y: 0 });
      }
    },
    {
      drag: { 
        bounds: { left: -200, right: 200, top: -200, bottom: 200 },
        rubberband: true
      },
      pinch: { scaleBounds: { min: 0.5, max: 3 } }
    }
  );

  return (
    <div className="overflow-hidden bg-gray-800 rounded-lg">
      <animated.img
        {...bind()}
        src={src}
        alt={alt}
        {...props}
        style={{
          scale,
          x,
          y,
          ...props.style
        }}
        className="touch-none select-none max-w-full h-auto"
      />
    </div>
  );
};

// 4. Pull-to-refresh (para actualizar listas)
export const PullToRefresh = ({ children, onRefresh, threshold = 80 }) => {
  const [{ y, opacity, rotate }, api] = useSpring(() => ({
    y: 0,
    opacity: 0,
    rotate: 0
  }));

  const bind = useDrag(
    ({ active, movement: [, my], velocity: [, vy] }) => {
      // Solo funciona si estamos en la parte superior
      const isAtTop = window.scrollY === 0;
      
      if (!isAtTop) return;

      if (!active) {
        if (my > threshold && vy > 0.2) {
          // Activar refresh
          onRefresh?.();
        }
        
        // Reset
        api.start({ y: 0, opacity: 0, rotate: 0 });
      } else {
        // Mostrar indicador de pull
        const progress = Math.min(my / threshold, 1);
        api.start({
          y: my * 0.5,
          opacity: progress,
          rotate: progress * 180,
          immediate: true
        });
      }
    },
    {
      bounds: { top: 0, bottom: threshold },
      rubberband: true,
      filterTaps: true
    }
  );

  return (
    <div {...bind()} className="relative">
      {/* Indicador de refresh */}
      <animated.div
        style={{
          y,
          opacity
        }}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full 
                   bg-indigo-600 text-white p-3 rounded-full z-10"
      >
        <animated.div style={{ rotate }}>
          ↻
        </animated.div>
      </animated.div>
      
      {children}
    </div>
  );
};

// Componente de ejemplo completo
const GesturesDemo = () => {
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  
  const exercises = [
    { name: "Push-ups", reps: "3x12" },
    { name: "Squats", reps: "3x15" },
    { name: "Plancha", reps: "3x30s" }
  ];

  return (
    <div className="p-4 space-y-8">
      <h2 className="text-xl font-bold text-white mb-4">Gestos Interactivos</h2>
      
      {/* Tarjeta arrastrable */}
      <div>
        <h3 className="text-lg text-gray-300 mb-2">Arrastrar para completar</h3>
        <DraggableCard
          className="bg-gray-800 p-4 rounded-lg"
          onSwipeLeft={() => console.log('Ejercicio completado!')}
          onSwipeRight={() => console.log('Saltar ejercicio')}
        >
          <div className="text-white">
            <h4 className="font-semibold">Push-ups</h4>
            <p className="text-gray-400">3 series × 12 repeticiones</p>
          </div>
        </DraggableCard>
      </div>

      {/* Carrusel */}
      <div>
        <h3 className="text-lg text-gray-300 mb-2">Carrusel de ejercicios</h3>
        <SwipeCarousel
          items={exercises.map((ex, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-lg text-center">
              <h4 className="text-white font-semibold">{ex.name}</h4>
              <p className="text-gray-400">{ex.reps}</p>
            </div>
          ))}
          currentIndex={carouselIndex}
          onIndexChange={setCarouselIndex}
        />
        <div className="flex justify-center mt-2 space-x-2">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === carouselIndex ? 'bg-indigo-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Imagen con zoom */}
      <div>
        <h3 className="text-lg text-gray-300 mb-2">Imagen con zoom (pellizcar/arrastrar)</h3>
        <ZoomableImage
          src="/api/placeholder/400/300"
          alt="Diagrama de ejercicio"
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

export default GesturesDemo;
