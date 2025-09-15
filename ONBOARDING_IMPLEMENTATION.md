# Sistema de Onboarding para Fit - Guía de Implementación

## 📋 Resumen del Sistema

Hemos implementado un sistema completo de onboarding para usuarios nuevos que incluye:

1. **Onboarding de 5 pasos** con guardado incremental
2. **Sistema de guías con globos** para mostrar la funcionalidad
3. **Detección automática** de usuarios nuevos
4. **Redirección inteligente** según preferencias

## 🚀 Pasos para Implementar

### 1. Ejecutar la migración de base de datos

```sql
-- Ejecutar en tu consola de Supabase
-- Archivo: database/migrations/add_onboarding_fields_to_perfiles.sql

ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS experiencia text,
  ADD COLUMN IF NOT EXISTS altura_cm int,
  ADD COLUMN IF NOT EXISTS peso_kg numeric(5,2),
  ADD COLUMN IF NOT EXISTS grasa_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS cintura_cm int,
  ADD COLUMN IF NOT EXISTS preferencia_inicio text;

-- Agregar constraints y comentarios (ver archivo completo)
```

### 2. Verificar dependencias

Asegúrate de tener instaladas estas dependencias:

```bash
npm install framer-motion react-router-dom
# Estas probablemente ya las tienes en tu proyecto
```

### 3. Probar el flujo completo

#### Paso 1: Crear un usuario de prueba
1. Ve a `/login` y crea una cuenta nueva con Google
2. Deberías ser redirigido automáticamente a `/onboarding`

#### Paso 2: Completar el onboarding
1. **Paso 1 - Objetivo**: Selecciona tu objetivo (perder peso, ganar músculo, etc.)
2. **Paso 2 - Experiencia**: Selecciona tu nivel (principiante, intermedio, avanzado)
3. **Paso 3 - Biometría**: Ingresa altura y peso (obligatorios), grasa corporal y cintura (opcionales)
4. **Paso 4 - Preferencias**: Elige cómo quieres comenzar (rutina, cursos, explorar)
5. **Paso 5 - Resumen**: Revisa la información y finaliza

#### Paso 3: Verificar redirección
Después de completar el onboarding, deberías ser redirigido según tu preferencia:
- **Rutina** → `/dashboard`
- **Cursos** → `/cursos`
- **Explorar** → `/dashboard`

## 🎯 Funcionalidades del Sistema

### Onboarding
- ✅ **Guardado incremental**: Cada paso se guarda automáticamente
- ✅ **Validaciones en tiempo real**: Campos requeridos y rangos válidos
- ✅ **Navegación fluida**: Botones de Volver/Continuar con estados
- ✅ **Barra de progreso**: Indicador visual del progreso
- ✅ **Animaciones suaves**: Transiciones con Framer Motion
- ✅ **Responsivo**: Funciona en móvil y escritorio

### Sistema de Guías
- ✅ **Globos automáticos**: Se muestran una sola vez por ruta
- ✅ **Spotlight**: Resalta el elemento objetivo
- ✅ **Botón de ayuda**: Permite relanzar la guía manualmente
- ✅ **Múltiples rutas**: Configuración por página
- ✅ **Persistencia**: Usa localStorage para recordar guías completadas

### Detección de Usuarios
- ✅ **Creación automática**: Perfil se crea al primer login
- ✅ **Redirección automática**: A onboarding si no completado
- ✅ **Estado persistente**: Información guardada en AuthContext

## 🔧 Configuración Avanzada

### Agregar nuevas rutas de guía

Edita `src/context/WidgetGuideContext.jsx`:

```javascript
const GUIDE_STEPS_BY_PATH = {
  '/dashboard': [
    {
      target: '[data-guide="nuevo-elemento"]',
      title: '🎯 Nuevo elemento',
      content: 'Descripción de la funcionalidad.',
      position: 'bottom'
    }
  ],
  '/nueva-ruta': [
    // Nuevos pasos para otra ruta
  ]
};
```

### Marcar elementos para guía

En tus componentes, agrega el atributo `data-guide`:

```jsx
<div data-guide="stats-overview">
  {/* Tu componente */}
</div>
```

### Personalizar validaciones de onboarding

Edita `src/pages/Onboarding.jsx` en la función `validateCurrentStep()`:

```javascript
case 3: // Biometría
  // Agregar nuevas validaciones aquí
  if (condition) {
    newErrors.campo = 'Mensaje de error';
  }
  break;
```

## 🧪 Testing y Debugging

### Comandos útiles para testing

```javascript
// En la consola del navegador

// Reiniciar todas las guías
window.widgetGuide?.resetAllGuides();

// Ver estado del onboarding
console.log('Onboarding completed:', user.onboardingCompleted);

// Verificar localStorage
console.log(localStorage.getItem('widget_guide_completed'));
```

### Problemas comunes y soluciones

#### 1. La redirección no funciona
- Verifica que la migración de BD se ejecutó correctamente
- Revisa la consola para errores de AuthContext
- Asegúrate de que `onboarding_completed` está en `false`

#### 2. Los globos no aparecen
- Verifica que los elementos tienen el atributo `data-guide`
- Comprueba que el usuario ha completado el onboarding
- Revisa la consola para errores del WidgetGuideContext

#### 3. Errores de validación
- Verifica los constraints de la BD (rangos de edad, altura, etc.)
- Comprueba que los campos requeridos tienen valores válidos

## 🎨 Personalización Visual

### Colores del tema
Los componentes usan las clases de Tailwind CSS del tema actual:
- `bg-gray-800`: Fondos oscuros
- `text-cyan-400`: Elementos destacados
- `border-gray-600`: Bordes sutiles

### Animaciones
Las animaciones se controlan con Framer Motion:
- Duración: `duration: 0.5`
- Easing: `ease: "easeOut"`
- Transiciones: `spring` para elementos deslizantes

## 📱 Consideraciones Móviles

### Viewport
- Usa `min-h-screen` para altura completa
- Padding responsivo con `px-4 py-8`
- Contenedor máximo con `max-w-2xl`

### Interacciones táctiles
- Botones con `hover:` y `active:` states
- Áreas de toque mínimas (44px)
- Scroll suave con `scrollIntoView`

## 🔐 Seguridad

### RLS (Row Level Security)
Las políticas existentes de Supabase se aplicarán automáticamente:
- Los usuarios solo pueden ver/editar sus propios perfiles
- Los admins tienen acceso completo

### Validaciones
- **Frontend**: Validaciones inmediatas para UX
- **Backend**: Constraints en BD para integridad de datos
- **Sanitización**: Los valores se procesan antes de guardar

## 🎯 Próximos Pasos Sugeridos

1. **Agregar más campos de onboarding** según tus necesidades
2. **Personalizar las rutas de redirección** post-onboarding
3. **Crear guías específicas** para cada página de tu app
4. **Implementar analytics** para medir la completación del onboarding
5. **Agregar A/B testing** para optimizar el flujo

## 🐛 Debugging

### Logs útiles
El sistema incluye logs detallados:
```
[AuthContext] Perfil no existe, creando nuevo perfil
[AuthContext] Redirigiendo a onboarding
[Onboarding] Datos del paso 1 guardados
[WidgetGuide] Iniciando guía para /dashboard con 3 pasos
```

### Estados importantes a verificar
- `user.onboardingCompleted`
- `completedGuides` en localStorage
- Datos guardados en la tabla `perfiles`

---

¡El sistema está listo para usar! 🎉

Si encuentras algún problema o necesitas agregar funcionalidades adicionales, todos los componentes están bien documentados y son fácilmente extensibles.
