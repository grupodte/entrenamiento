# 🔔 Sistema Avanzado de Notificaciones - Fit App

Este documento describe la implementación completa del sistema de notificaciones avanzado para la aplicación Fit, siguiendo los patrones y mejores prácticas descritos en la documentación técnica.

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Guía de Uso](#guía-de-uso)
5. [API del Sistema](#api-del-sistema)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Servidor Push](#servidor-push)
8. [Troubleshooting](#troubleshooting)

## 🎯 Visión General

El sistema de notificaciones de Fit integra múltiples tecnologías para ofrecer una experiencia completa:

- **🔔 Notificaciones Push**: Usando Service Workers y Web Push API
- **🍞 Notificaciones Toast**: Sistema avanzado de notificaciones en la UI
- **🔊 Alertas de Audio**: Sonidos adaptativos que respetan las políticas del navegador
- **📱 PWA**: Funcionalidad offline-first con sincronización de notificaciones

### Funcionalidades Implementadas

✅ **Notificaciones Push completas**
- Suscripción/desuscripción automática
- Manejo de eventos push del servidor
- Integración con backend Node.js

✅ **Sistema de Toast avanzado**
- 7 tipos diferentes de notificaciones
- Animaciones con Framer Motion
- Notificaciones específicas para fitness

✅ **Alertas de Audio**
- Respeta políticas de autoplay del navegador
- Patrón de desbloqueo por gesto del usuario
- Múltiples tipos de sonidos (logros, descansos, etc.)

✅ **Service Worker expandido**
- Manejo avanzado de eventos push
- Comunicación bidireccional con la aplicación
- Gestión inteligente de notificaciones

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │  Service Worker  │    │  Push Server    │
│                 │    │                  │    │                 │
│ useNotifications├────┤ sw.js            ├────┤ push-service.js │
│ ToastProvider   │    │ - Push events    │    │ - VAPID keys    │
│ Audio System    │    │ - Notifications  │    │ - Subscriptions │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Componentes Principales

1. **Service Worker (`src/sw.js`)**
   - Maneja eventos push del servidor
   - Gestiona notificaciones de sistema
   - Comunicación con la aplicación React

2. **Hook Principal (`useNotifications`)**
   - API unificada para todas las notificaciones
   - Combina push, toast y audio
   - Funciones específicas para fitness

3. **Sistema de Toast (`ToastSystem.jsx`)**
   - Componentes personalizados con Tailwind CSS
   - Context Provider para estado global
   - Animaciones y transiciones suaves

4. **Servidor Push (`server/push-service.js`)**
   - API REST para gestión de suscripciones
   - Envío de notificaciones desde el backend
   - Panel de pruebas integrado

## 🚀 Instalación y Configuración

### 1. Dependencias

Las dependencias ya están instaladas:

```bash
# Frontend
npm install framer-motion @heroicons/react

# Backend
npm install web-push express cors dotenv concurrently
```

### 2. Scripts de Package.json

```json
{
  "scripts": {
    "dev": "vite",
    "server:push": "node server/push-service.js",
    "dev:full": "concurrently \"npm run dev\" \"npm run server:push\""
  }
}
```

### 3. Configuración de Variables de Entorno

Crear `.env` en la raíz del proyecto:

```env
# Generar estas claves ejecutando el servidor por primera vez
VAPID_PUBLIC_KEY=tu_clave_publica_vapid
VAPID_PRIVATE_KEY=tu_clave_privada_vapid

# Configuración del servidor
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Iniciar el Sistema Completo

```bash
# Opción 1: Todo junto
npm run dev:full

# Opción 2: Por separado
npm run dev        # Terminal 1
npm run server:push # Terminal 2
```

## 📖 Guía de Uso

### Uso Básico con el Hook Unificado

```jsx
import { useNotifications } from '../hooks/useNotifications';

function WorkoutComponent() {
  const notifications = useNotifications();
  
  // Inicializar al montar el componente
  useEffect(() => {
    notifications.initialize();
  }, []);
  
  const handleWorkoutStart = () => {
    notifications.workoutStart('Rutina de Pecho');
  };
  
  const handleRestComplete = () => {
    notifications.restComplete('Press de banca');
  };
  
  const handleAchievement = () => {
    notifications.achievement('Primer mes completado', '¡Has entrenado 30 días!');
  };
  
  return (
    <div>
      <button onClick={handleWorkoutStart}>Iniciar Entrenamiento</button>
      <button onClick={handleRestComplete}>Completar Descanso</button>
      <button onClick={handleAchievement}>Desbloquear Logro</button>
    </div>
  );
}
```

### Configuración de Permisos

```jsx
import { useNotifications } from '../hooks/useNotifications';

function SettingsComponent() {
  const notifications = useNotifications();
  
  const handleSetupNotifications = async () => {
    const result = await notifications.requestPermissions();
    
    if (result.notifications && result.audio && result.push) {
      notifications.success('¡Notificaciones configuradas!');
    }
  };
  
  return (
    <button onClick={handleSetupNotifications}>
      Configurar Notificaciones
    </button>
  );
}
```

## 🔧 API del Sistema

### Hook `useNotifications`

#### Funciones de Inicialización
- `initialize()`: Configura el sistema automáticamente
- `requestPermissions()`: Solicita todos los permisos necesarios

#### Notificaciones Específicas de Fitness
- `restComplete(exerciseName)`: Notificación de descanso terminado
- `achievement(name, description)`: Logro desbloqueado
- `streak(days, message?)`: Racha de entrenamientos
- `workoutStart(workoutName)`: Inicio de entrenamiento
- `countdown(count, onComplete)`: Countdown 3-2-1
- `restTimer(exercise, seconds, onSkip)`: Timer visual de descanso

#### Progreso y Estadísticas
- `progress(title, message)`: Actualización de progreso
- `weightUpdate(newWeight, difference)`: Cambio de peso
- `personalRecord(exercise, newRecord, oldRecord)`: Nuevo récord personal

#### Notificaciones Básicas
- `success(message, title?)`: Notificación de éxito
- `error(message, title?)`: Notificación de error
- `warning(message, title?)`: Notificación de advertencia

#### Configuración y Estado
- `getStatus()`: Estado completo del sistema
- `test()`: Probar todas las notificaciones
- `isFullyConfigured`: Booleano del estado general

### Sistema de Toast

#### Tipos Disponibles
- `success`: Operaciones exitosas
- `error`: Errores y fallos
- `warning`: Advertencias
- `info`: Información general
- `workout`: Específico para entrenamientos
- `achievement`: Logros desbloqueados
- `streak`: Rachas de entrenamiento

### Audio System

#### Sonidos Predefinidos
- `notification`: Sonido básico de notificación
- `success`: Sonido de éxito (escalas ascendentes)
- `error`: Sonido de error (tonos graves)
- `rest_complete`: Secuencia para final de descanso
- `achievement`: Melodía especial para logros
- `workout_start`: Sonido energético de inicio
- `countdown`: Tick de cuenta regresiva

## 💻 Ejemplos Prácticos

### 1. Sistema de Descanso Completo

```jsx
function RestTimerExample() {
  const notifications = useNotifications();
  
  const startRest = (exercise, seconds) => {
    // Iniciar timer visual con sonido al finalizar
    notifications.restTimer(
      exercise, 
      seconds, 
      () => {
        // Callback si el usuario quiere saltar
        notifications.success('Descanso saltado');
      }
    );
    
    // Cuando termine el tiempo automáticamente
    setTimeout(() => {
      notifications.restComplete(exercise);
    }, seconds * 1000);
  };
  
  return (
    <button onClick={() => startRest('Press de banca', 90)}>
      Descanso 90s
    </button>
  );
}
```

### 2. Sistema de Logros

```jsx
function AchievementSystem() {
  const notifications = useNotifications();
  
  const checkAchievements = (workoutData) => {
    // Verificar si es el primer entrenamiento
    if (workoutData.totalWorkouts === 1) {
      notifications.achievement(
        'Primer paso', 
        '¡Has completado tu primer entrenamiento!'
      );
    }
    
    // Verificar récords personales
    if (workoutData.personalRecord) {
      notifications.personalRecord(
        workoutData.exercise,
        workoutData.newWeight,
        workoutData.previousRecord
      );
    }
    
    // Verificar rachas
    if (workoutData.streak && workoutData.streak % 5 === 0) {
      notifications.streak(workoutData.streak);
    }
  };
  
  return null; // Componente lógico
}
```

### 3. Integración con Formularios

```jsx
function WorkoutForm() {
  const notifications = useNotifications();
  
  const handleSubmit = async (workoutData) => {
    try {
      notifications.toast.loading('Guardando entrenamiento...');
      
      await saveWorkout(workoutData);
      
      notifications.success('Entrenamiento guardado correctamente');
      
      // Verificar si hay logros
      checkForAchievements(workoutData);
      
    } catch (error) {
      notifications.error(
        'No se pudo guardar el entrenamiento',
        'Error de conexión'
      );
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
}
```

## 🖥️ Servidor Push

### Endpoints Disponibles

#### Gestión de Suscripciones
- `POST /api/push/subscribe`: Suscribirse a notificaciones
- `POST /api/push/unsubscribe`: Desuscribirse
- `GET /api/push/stats`: Estadísticas de suscripciones

#### Envío de Notificaciones
- `POST /api/push/send-all`: Enviar a todos los suscriptores
- `POST /api/push/send-fitness`: Notificaciones específicas de fitness

#### Utilidades
- `GET /api/vapid-public-key`: Obtener clave pública VAPID
- `GET /api/push/test-panel`: Panel de pruebas web

### Panel de Pruebas

Acceder a `http://localhost:3001/api/push/test-panel` para:
- Ver estadísticas de suscripciones
- Enviar notificaciones de prueba
- Probar diferentes tipos de notificaciones fitness

### Uso del API desde el Frontend

```javascript
// Enviar notificación de recordatorio de entrenamiento
const sendWorkoutReminder = async () => {
  await fetch('/api/push/send-fitness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'workout_reminder',
      data: {
        message: '¿Listo para entrenar piernas hoy?'
      }
    })
  });
};
```

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. "Las notificaciones no aparecen"
- ✅ Verificar que los permisos estén concedidos
- ✅ Comprobar que el Service Worker esté activo
- ✅ Revisar las DevTools > Application > Service Workers

#### 2. "El audio no suena"
- ✅ Hacer clic en cualquier parte de la página para desbloquear audio
- ✅ Verificar que el volumen del sistema esté activado
- ✅ Comprobar configuración de audio en la página de notificaciones

#### 3. "Error de suscripción push"
- ✅ Verificar que el servidor push esté ejecutándose
- ✅ Comprobar las claves VAPID en el .env
- ✅ Revisar la consola para errores de red

#### 4. "Service Worker no actualiza"
- ✅ Hacer hard refresh (Ctrl+Shift+R)
- ✅ Limpiar cache en DevTools
- ✅ Verificar que el SW se haya registrado correctamente

### Comandos de Debugging

```bash
# Verificar estado del sistema
curl http://localhost:3001/api/push/stats

# Probar notificación
curl -X POST http://localhost:3001/api/push/send-all \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Probando notificaciones"}'

# Generar nuevas claves VAPID
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

### DevTools Útiles

1. **Application > Service Workers**: Ver estado del SW
2. **Application > Storage**: Ver suscripciones almacenadas
3. **Console**: Logs de debugging del sistema
4. **Network**: Verificar requests del API push

## 📱 Página de Configuración

La aplicación incluye una página completa de configuración en `/notificaciones`:

- **Gestión de permisos**: Interfaz intuitiva para activar notificaciones
- **Configuración de audio**: Volumen y habilitación de sonidos
- **Testing integrado**: Botones para probar todas las funcionalidades
- **Estado del sistema**: Información detallada del estado

## 🎨 Personalización

### Modificar Sonidos

Editar `src/hooks/useAudioNotifications.js`:

```javascript
const SOUND_CONFIGS = {
  custom_sound: {
    pattern: [
      { freq: 440, dur: 200 },  // La
      { freq: 523, dur: 200 },  // Do
      { freq: 659, dur: 400 }   // Mi
    ],
    volume: 0.15
  }
};
```

### Añadir Tipos de Toast

Editar `src/components/notifications/ToastSystem.jsx`:

```javascript
const colors = {
  custom: {
    bg: 'bg-gradient-to-r from-pink-50 to-purple-50',
    border: 'border-pink-200',
    icon: 'text-pink-600',
    // ... más colores
  }
};
```

### Personalizar Notificaciones Push

Editar `server/push-service.js` para añadir nuevos tipos:

```javascript
const fitnessNotifications = {
  custom_notification: {
    title: '🎯 Título personalizado',
    body: data.message || 'Mensaje por defecto',
    actions: [
      { action: 'custom-action', title: '✨ Acción personalizada' }
    ]
  }
};
```

## 🚀 Próximos Pasos

1. **Integración con base de datos**: Reemplazar almacenamiento en memoria
2. **Notificaciones programadas**: Sistema de cron jobs para recordatorios
3. **Segmentación de usuarios**: Envío selectivo por grupos
4. **Analytics**: Métricas de engagement con notificaciones
5. **Plantillas avanzadas**: Sistema de templates para notificaciones

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Verificar los logs del navegador y servidor
3. Usar el panel de pruebas en `/api/push/test-panel`
4. Comprobar el estado del sistema en `/notificaciones`

¡El sistema está listo para potenciar la experiencia de entrenamiento de los usuarios! 🎉💪
