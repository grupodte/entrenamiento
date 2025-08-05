# Sistema de Animaciones Unificado

Este sistema proporciona una serie de componentes y utilidades para crear animaciones consistentes y fluidas en toda la aplicación, siguiendo los principios de diseño de iOS.

## Componentes Principales

### 1. AnimatedLayout
Wrapper global para todas las páginas que proporciona transiciones suaves de entrada/salida.

```jsx
import { AnimatedLayout } from '../../components/animations';

const MiPagina = () => {
  return (
    <AnimatedLayout className="p-6">
      {/* Contenido de la página */}
    </AnimatedLayout>
  );
};
```

**Props:**
- `children`: Contenido a animar
- `className`: Clases CSS adicionales

### 2. AnimatedButton
Botón con microinteracciones fluidas que incluye estados de hover, tap y loading.

```jsx
import { AnimatedButton } from '../../components/animations';

const MiComponente = () => {
  return (
    <>
      <AnimatedButton variant="primary" onClick={handleClick}>
        Guardar
      </AnimatedButton>
      
      <AnimatedButton variant="secondary" loading={isLoading}>
        Cargando...
      </AnimatedButton>
      
      <AnimatedButton variant="destructive">
        Eliminar
      </AnimatedButton>
      
      <AnimatedButton variant="icon">
        <IconComponent />
      </AnimatedButton>
    </>
  );
};
```

**Props:**
- `variant`: 'primary', 'secondary', 'icon', 'destructive'
- `disabled`: boolean
- `loading`: boolean
- `onClick`: función de click
- `className`: clases CSS adicionales

### 3. AnimatedList y AnimatedListItem
Componentes para crear listas con animación stagger (elementos aparecen secuencialmente).

```jsx
import { AnimatedList, AnimatedListItem } from '../../components/animations';

const MiLista = ({ items }) => {
  return (
    <AnimatedList className="space-y-4" staggerDelay={0.1}>
      {items.map((item) => (
        <AnimatedListItem key={item.id}>
          <div className="p-4 bg-white rounded">
            {item.nombre}
          </div>
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
};
```

**Props AnimatedList:**
- `children`: elementos de la lista
- `className`: clases CSS
- `staggerDelay`: delay entre animaciones (default: 0.1s)

**Props AnimatedListItem:**
- `children`: contenido del item
- `className`: clases CSS
- `delay`: delay personalizado para este item

### 4. AnimatedFeedback y useFeedback
Sistema de notificaciones animadas.

```jsx
import { useFeedback, AnimatedFeedback } from '../../components/animations';

const MiComponente = () => {
  const { showSuccess, showError, showWarning, showInfo, feedback } = useFeedback();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Datos guardados correctamente');
    } catch (error) {
      showError('Error al guardar los datos');
    }
  };

  return (
    <div>
      <button onClick={handleSave}>Guardar</button>
      
      <AnimatedFeedback
        show={feedback.show}
        type={feedback.type}
        message={feedback.message}
        onClose={() => hideFeedback()}
      />
    </div>
  );
};
```

**Métodos del hook:**
- `showSuccess(message, duration?)`: Muestra notificación de éxito
- `showError(message, duration?)`: Muestra notificación de error
- `showWarning(message, duration?)`: Muestra notificación de advertencia
- `showInfo(message, duration?)`: Muestra notificación informativa

### 5. Componentes Drag & Drop
Mejoras para las animaciones de arrastrar y soltar.

```jsx
import { 
  AnimatedDraggable, 
  AnimatedDropZone, 
  AnimatedDragOverlay 
} from '../../components/animations';

const MiComponenteDragDrop = () => {
  return (
    <DndContext>
      <AnimatedDraggable isDragging={isDragging}>
        <div>Elemento arrastrable</div>
      </AnimatedDraggable>
      
      <AnimatedDropZone isOver={isOver} isActive={isActive}>
        <div>Zona de drop</div>
      </AnimatedDropZone>
      
      <DragOverlay>
        <AnimatedDragOverlay>
          <div>Elemento siendo arrastrado</div>
        </AnimatedDragOverlay>
      </DragOverlay>
    </DndContext>
  );
};
```

## Configuración y Constantes

### animationConfig
Configuraciones predefinidas para diferentes tipos de animaciones:

```jsx
import { animationConfig } from '../../components/animations';

// Transición al estilo iOS
const iosTransition = animationConfig.ios;

// Spring suave
const springTransition = animationConfig.spring;

// Spring rápido para microinteracciones
const microSpringTransition = animationConfig.microSpring;

// Fade simple
const fadeTransition = animationConfig.fade;
```

### commonVariants
Variantes reutilizables para animaciones comunes:

```jsx
import { commonVariants } from '../../components/animations';
import { motion } from 'framer-motion';

const MiComponente = () => {
  return (
    <motion.div
      variants={commonVariants.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      Contenido con fade in
    </motion.div>
  );
};
```

**Variantes disponibles:**
- `fadeIn`: Aparición con fade
- `slideUp`: Deslizamiento hacia arriba
- `slideDown`: Deslizamiento hacia abajo
- `scale`: Escalado suave

## Principios de Diseño

### 1. Consistencia
Todas las animaciones siguen los mismos principios de timing y easing, inspirados en iOS.

### 2. Naturalidad
Las animaciones imitan movimientos físicos naturales usando springs y easing curves apropiadas.

### 3. Jerarquía Visual
Las animaciones stagger y delays ayudan a establecer jerarquía y orden de importancia.

### 4. Rendimiento
Todas las animaciones están optimizadas para 60fps y usan propiedades que no causan reflow/repaint.

## Integración en Componentes Existentes

### Pasos para migrar un componente:

1. **Importar los componentes necesarios:**
```jsx
import { AnimatedLayout, AnimatedButton, AnimatedList } from '../../components/animations';
```

2. **Envolver el contenido principal:**
```jsx
return (
  <AnimatedLayout>
    {/* contenido existente */}
  </AnimatedLayout>
);
```

3. **Reemplazar botones estáticos:**
```jsx
// Antes
<button onClick={handleClick} className="btn-primary">
  Guardar
</button>

// Después
<AnimatedButton variant="primary" onClick={handleClick}>
  Guardar
</AnimatedButton>
```

4. **Convertir listas:**
```jsx
// Antes
<ul className="space-y-4">
  {items.map(item => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>

// Después
<AnimatedList className="space-y-4">
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      {item.name}
    </AnimatedListItem>
  ))}
</AnimatedList>
```

## Ejemplos de Uso Avanzado

### Animación personalizada con motion:
```jsx
import { motion } from 'framer-motion';
import { animationConfig } from '../../components/animations';

const ComponentePersonalizado = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={animationConfig.ios}
    >
      Contenido personalizado
    </motion.div>
  );
};
```

### Combinando múltiples animaciones:
```jsx
const ComponenteComplejo = () => {
  return (
    <AnimatedLayout>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Título
      </motion.h1>
      
      <AnimatedList staggerDelay={0.05}>
        {items.map(item => (
          <AnimatedListItem key={item.id}>
            <motion.div whileHover={{ scale: 1.02 }}>
              {item.content}
            </motion.div>
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </AnimatedLayout>
  );
};
```

## Consideraciones de Rendimiento

1. **Usar transform y opacity**: Estas propiedades no causan reflow
2. **Evitar animar width/height**: Usar scale en su lugar
3. **Limitar animaciones simultáneas**: No más de 5-6 elementos animándose al mismo tiempo
4. **Usar will-change con moderación**: Solo en elementos que se van a animar

## Futuras Extensiones

- Soporte para animaciones de ruta (page transitions)
- Gestos más avanzados (pinch, rotate)
- Animaciones basadas en scroll
- Soporte para modo oscuro en las transiciones
