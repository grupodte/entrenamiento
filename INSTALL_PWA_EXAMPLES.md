# 🎯 Cómo usar useInstallPWA - Control Total

## 🚀 Hook Simple para Instalar PWA

Ahora tienes control total sobre DÓNDE y CÓMO mostrar el botón de instalar.

## Uso Básico

```jsx
import useInstallPWA from '../hooks/useInstallPWA';

const MiComponente = () => {
  const { 
    handleInstallApp, 
    shouldShowInstallButton, 
    getInstallButtonText,
    isInstalling 
  } = useInstallPWA();

  return (
    <div>
      {shouldShowInstallButton() && (
        <button 
          onClick={handleInstallApp}
          disabled={isInstalling}
        >
          {getInstallButtonText()}
        </button>
      )}
    </div>
  );
};
```

## 📱 Ejemplos de Implementación

### 1. Botón Simple en Header
```jsx
import useInstallPWA from '../hooks/useInstallPWA';

const Header = () => {
  const { handleInstallApp, shouldShowInstallButton, getInstallButtonText } = useInstallPWA();
  
  return (
    <header>
      <nav>
        {/* ... otros elementos ... */}
        
        {shouldShowInstallButton() && (
          <button 
            onClick={handleInstallApp}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            📱 {getInstallButtonText()}
          </button>
        )}
      </nav>
    </header>
  );
};
```

### 2. Card de Instalación
```jsx
import useInstallPWA from '../hooks/useInstallPWA';

const InstallCard = () => {
  const { 
    handleInstallApp, 
    shouldShowInstallButton, 
    isInstalling,
    isIOS 
  } = useInstallPWA();
  
  if (!shouldShowInstallButton()) return null;
  
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
      <h3>🚀 Instala FitApp</h3>
      <p>Acceso rápido desde tu escritorio</p>
      
      <button 
        onClick={handleInstallApp}
        disabled={isInstalling}
        className="mt-3 bg-white text-blue-600 px-4 py-2 rounded font-bold"
      >
        {isInstalling ? '⏳ Instalando...' : (isIOS ? '📱 Añadir a Inicio' : '⬇️ Instalar')}
      </button>
    </div>
  );
};
```

### 3. Botón Flotante Personalizado
```jsx
import useInstallPWA from '../hooks/useInstallPWA';

const MiBotonFlotante = () => {
  const { handleInstallApp, shouldShowInstallButton, isInstalling } = useInstallPWA();
  
  if (!shouldShowInstallButton()) return null;
  
  return (
    <button 
      onClick={handleInstallApp}
      disabled={isInstalling}
      className="
        fixed bottom-6 right-6 z-50
        bg-gradient-to-r from-purple-600 to-pink-600 
        text-white rounded-full p-4 shadow-lg
        hover:scale-105 transition-transform
      "
    >
      {isInstalling ? '⏳' : '📱'}
    </button>
  );
};
```

### 4. En un Menú Dropdown
```jsx
import useInstallPWA from '../hooks/useInstallPWA';

const UserMenu = () => {
  const { handleInstallApp, shouldShowInstallButton, getInstallButtonText } = useInstallPWA();
  
  return (
    <div className="dropdown-menu">
      <a href="/profile">Mi Perfil</a>
      <a href="/settings">Configuración</a>
      
      {shouldShowInstallButton() && (
        <button 
          onClick={handleInstallApp}
          className="dropdown-item text-blue-600"
        >
          📱 {getInstallButtonText()}
        </button>
      )}
      
      <a href="/logout">Cerrar Sesión</a>
    </div>
  );
};
```

### 5. Banner en Dashboard
```jsx
import useInstallPWA from '../hooks/useInstallPWA';

const Dashboard = () => {
  const { handleInstallApp, shouldShowInstallButton } = useInstallPWA();
  
  return (
    <div>
      {shouldShowInstallButton() && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-blue-800 font-bold">¡Instala FitApp!</h4>
              <p className="text-blue-600">Acceso más rápido y uso sin internet</p>
            </div>
            <button 
              onClick={handleInstallApp}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Instalar
            </button>
          </div>
        </div>
      )}
      
      {/* ... resto del dashboard ... */}
    </div>
  );
};
```

## 🎛️ Estados Disponibles

```jsx
const {
  // Estados básicos
  isInstallable,      // true si la PWA se puede instalar
  isInstalling,       // true mientras se instala
  isInstalled,        // true si ya está instalada
  canInstall,         // true si hay prompt disponible
  
  // Información del navegador
  isIOS,              // true en iPhone/iPad
  isChrome,           // true en Chrome
  isSafari,           // true en Safari
  
  // Funciones principales
  handleInstallApp,           // ← LA FUNCIÓN PRINCIPAL
  getInstallButtonText,       // texto dinámico para el botón
  shouldShowInstallButton,    // si mostrar el botón o no
  
  // Extras
  showManualInstructions     // mostrar instrucciones manuales
} = useInstallPWA();
```

## ✨ Funcionalidad Incluida

- ✅ **Instalación automática** en Chrome/Edge
- ✅ **Instrucciones paso a paso** en iOS Safari  
- ✅ **Toast notifications** de éxito/error
- ✅ **Estados de loading** mientras instala
- ✅ **Detección automática** de navegador
- ✅ **Se oculta** cuando ya está instalada

## 🎯 Uso Recomendado

**Para máximo control:**
```jsx
const MiBoton = () => {
  const { handleInstallApp, shouldShowInstallButton } = useInstallPWA();
  
  return shouldShowInstallButton() ? (
    <button onClick={handleInstallApp}>
      🚀 Instalar App
    </button>
  ) : null;
};
```

**¡Ahora tienes control total! 🎉** Puedes poner este botón donde quieras y con el diseño que quieras.
