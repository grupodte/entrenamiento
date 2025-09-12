# 🚀 PWA Install Widgets - FitApp

## Widgets disponibles

### 1. SimpleInstallWidget (Recomendado) 
**Botón flotante compacto en esquina inferior derecha**

```jsx
import { SimpleInstallWidget } from '../components/PWAInstallWidget';

// Uso simple - aparece automáticamente cuando la PWA es instalable
<SimpleInstallWidget />
```

**Características:**
- ✅ Un solo clic para instalar
- ✅ Se oculta automáticamente cuando ya está instalada
- ✅ Funciona en iOS con instrucciones manuales 
- ✅ Botón de cerrar discreto
- ✅ Animaciones y estados de loading
- ✅ Posicionamiento fijo que no molesta

### 2. ExpandedInstallWidget
**Widget expandido con más información**

```jsx
import { ExpandedInstallWidget } from '../components/PWAInstallWidget';

const [showInstallWidget, setShowInstallWidget] = useState(true);

<ExpandedInstallWidget 
  onDismiss={() => setShowInstallWidget(false)}
/>
```

### 3. PWAInstallWidget (Personalizable)
**Widget completamente personalizable**

```jsx
import PWAInstallWidget from '../components/PWAInstallWidget';

<PWAInstallWidget 
  variant="compact"           // 'compact' | 'expanded'
  position="bottom-right"     // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center'
  onDismiss={handleDismiss}
/>
```

## Comportamiento Inteligente

### 🔍 Detección Automática
- **Chrome/Edge**: Usa la instalación nativa automática
- **iOS Safari**: Muestra instrucciones paso a paso para "Añadir a pantalla de inicio"
- **Otros navegadores**: Instrucciones generales de instalación

### 📱 Estados
- **No instalable**: Widget no se muestra
- **Instalable**: Botón azul con ícono de descarga
- **Instalando**: Estado de loading con animación
- **Ya instalada**: Widget se oculta automáticamente

### ✨ Experiencia de Usuario
- **Un clic**: Instalación automática en navegadores compatibles
- **iOS optimizado**: Instrucciones claras y visuales para Safari
- **Responsive**: Funciona perfectamente en móvil y escritorio
- **No invasivo**: Fácil de descartar si no interesa

## Implementación Actual

### Landing Page
```jsx
import { SimpleInstallWidget } from '../components/PWAInstallWidget';

// Al final del componente
<SimpleInstallWidget />
```

### Layout de Usuario (AlumnoLayout)
```jsx
import { SimpleInstallWidget } from '../components/PWAInstallWidget';

// Al final del layout
<SimpleInstallWidget />
```

## Personalización de Posición

```jsx
// Esquina inferior derecha (default)
<PWAInstallWidget position="bottom-right" />

// Esquina inferior izquierda  
<PWAInstallWidget position="bottom-left" />

// Centro inferior
<PWAInstallWidget position="bottom-center" />

// Esquinas superiores
<PWAInstallWidget position="top-right" />
<PWAInstallWidget position="top-left" />
```

## Integración con Toast

Los widgets usan `react-hot-toast` para mostrar notificaciones:
- ✅ "¡FitApp instalada! 🎉" cuando se instala correctamente
- ❌ "Instalación cancelada" si el usuario cancela  
- ❌ "Instalación no disponible" si hay problemas

## Testing

Para probar en desarrollo:
1. Abre Chrome DevTools > Application > Manifest
2. Verifica que el manifest esté bien configurado
3. El widget debería aparecer automáticamente
4. En iOS Safari: prueba las instrucciones manuales

---

**¡El widget simple es todo lo que necesitas!** Con un solo `<SimpleInstallWidget />` tendrás instalación PWA funcionando perfectamente. 🚀
