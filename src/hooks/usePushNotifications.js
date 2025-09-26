import { useState, useEffect, useCallback, useRef } from 'react';

// La clave pública VAPID se obtendrá del servidor
let VAPID_PUBLIC_KEY = null;

// Función para convertir base64 a Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');
  const swRegistration = useRef(null);

  // Verificar soporte del navegador
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(supported);
      
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
      
      return supported;
    };

    if (checkSupport()) {
      initializeServiceWorker();
    }
  }, []);

  // Obtener clave VAPID del servidor
  const fetchVapidKey = useCallback(async () => {
    if (VAPID_PUBLIC_KEY) return VAPID_PUBLIC_KEY;
    
    try {
      const response = await fetch('/api/vapid-public-key');
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      const data = await response.json();
      VAPID_PUBLIC_KEY = data.publicKey;
      console.log('Clave VAPID obtenida del servidor');
      return VAPID_PUBLIC_KEY;
    } catch (error) {
      console.warn('No se pudo obtener la clave VAPID del servidor, usando clave por defecto:', error);
      // Clave por defecto para desarrollo
      VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI_9PJvf8a7q_qHp9gBF1_2JjqMJt5_Wm9mKX4Xr1RnYJcN-Xw4z4WGZ9s';
      return VAPID_PUBLIC_KEY;
    }
  }, []);

  // Inicializar Service Worker
  const initializeServiceWorker = useCallback(async () => {
    try {
      // Primero obtener la clave VAPID
      await fetchVapidKey();
      
      const registration = await navigator.serviceWorker.ready;
      swRegistration.current = registration;
      
      // Verificar suscripción existente
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
        console.log('Suscripción push existente encontrada:', existingSubscription);
      }
      
      // Configurar listener para mensajes del SW
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
    } catch (error) {
      console.error('Error inicializando Service Worker:', error);
      setError('Error inicializando notificaciones push');
    }
  }, [fetchVapidKey]);

  // Manejar mensajes del Service Worker
  const handleServiceWorkerMessage = useCallback((event) => {
    const { data } = event;
    
    if (data && data.type === 'NOTIFICATION_CLICKED') {
      console.log('Notificación clickeada:', data);
      // Aquí puedes manejar la navegación o acciones específicas
    }
    
    if (data && data.type === 'PLAY_SOUND') {
      // Manejar reproducción de sonido
      playNotificationSound(data.soundType);
    }
  }, []);

  // Solicitar permiso de notificaciones
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      throw new Error('Las notificaciones no son soportadas en este navegador');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result !== 'granted') {
      throw new Error('Permisos de notificación denegados');
    }
    
    return result;
  }, []);

  // Suscribirse a notificaciones push
  const subscribeToPush = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Las notificaciones push no son soportadas');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Solicitar permisos si no los tenemos
      if (permission !== 'granted') {
        await requestPermission();
      }

      const registration = swRegistration.current;
      if (!registration) {
        throw new Error('Service Worker no registrado');
      }

      // Asegurar que tenemos la clave VAPID
      const vapidKey = await fetchVapidKey();
      
      // Crear suscripción
      const subscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      };

      const newSubscription = await registration.pushManager.subscribe(subscriptionOptions);
      
      // Enviar suscripción al servidor
      await sendSubscriptionToServer(newSubscription);
      
      setSubscription(newSubscription);
      setIsSubscribed(true);
      
      console.log('Suscripción push creada:', newSubscription);
      return newSubscription;

    } catch (error) {
      console.error('Error suscribiéndose a push:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission, fetchVapidKey]);

  // Desuscribirse de notificaciones push
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await subscription.unsubscribe();
      
      if (success) {
        // Notificar al servidor que se desuscribió
        await removeSubscriptionFromServer(subscription);
        
        setSubscription(null);
        setIsSubscribed(false);
        console.log('Desuscripción exitosa');
      }
      
      return success;
    } catch (error) {
      console.error('Error desuscribiéndose:', error);
      setError('Error al desuscribirse');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  // Enviar suscripción al servidor
  const sendSubscriptionToServer = async (subscription) => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      console.log('Suscripción enviada al servidor:', result);
      return result;
    } catch (error) {
      console.error('Error enviando suscripción al servidor:', error);
      // No lanzar error aquí para no bloquear la funcionalidad local
    }
  };

  // Remover suscripción del servidor
  const removeSubscriptionFromServer = async (subscription) => {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error removiendo suscripción del servidor:', error);
    }
  };

  // Reproducir sonido de notificación
  const playNotificationSound = useCallback((soundType = 'notification') => {
    try {
      // Solo intentar reproducir si el usuario ya ha interactuado
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        console.log('AudioContext suspendido, el usuario debe interactuar primero');
        return;
      }

      // Crear un sonido simple usando Web Audio API
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar el sonido según el tipo
      const soundConfig = {
        notification: { frequency: 800, duration: 200 },
        success: { frequency: 1000, duration: 150 },
        error: { frequency: 400, duration: 300 },
        notification_click: { frequency: 1200, duration: 100 }
      };
      
      const config = soundConfig[soundType] || soundConfig.notification;
      
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration / 1000);
      
      console.log(`Reproduciendo sonido: ${soundType}`);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  }, []);

  // Enviar mensaje al Service Worker
  const sendMessageToSW = useCallback((message) => {
    if (swRegistration.current && swRegistration.current.active) {
      swRegistration.current.active.postMessage(message);
    }
  }, []);

  // Solicitar estado del Service Worker
  const getServiceWorkerStatus = useCallback(() => {
    return new Promise((resolve) => {
      if (!swRegistration.current || !swRegistration.current.active) {
        resolve({ status: 'inactive' });
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      swRegistration.current.active.postMessage(
        { type: 'SW_STATUS' },
        [messageChannel.port2]
      );

      // Timeout después de 5 segundos
      setTimeout(() => {
        resolve({ status: 'timeout' });
      }, 5000);
    });
  }, []);

  return {
    // Estado
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permission,
    subscription,

    // Métodos
    subscribeToPush,
    unsubscribeFromPush,
    requestPermission,
    playNotificationSound,
    sendMessageToSW,
    getServiceWorkerStatus,

    // Utilidades
    resetError: () => setError(null)
  };
};
