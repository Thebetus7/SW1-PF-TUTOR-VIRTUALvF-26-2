// frontend-mobile/src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import axios from 'axios';

// Comportamiento de notificación en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// URL del Backend: toma EXPO_PUBLIC_API_URL del archivo .env.
// Si no está definido en .env, utiliza la IP de la máquina en red Wi-Fi (192.168.1.100) para Expo Go en celular físico.
const DEFAULT_FALLBACK_URL = 'http://192.168.1.100:3000/api/v1';

export const BACKEND_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_FALLBACK_URL).replace(/\/+$/, '');

if (__DEV__) {
  console.log(`[Mobile API] Conectando a backend en: ${BACKEND_URL}`);
}

export async function registerForPushNotificationsAsync(teacherToken?: string): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Inscripciones de Alumnos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permiso de notificaciones push denegado');
    return null;
  }

  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    token = pushTokenData.data;
  } catch (error) {
    // En Expo Go (especialmente en Android a partir de SDK 51/58),
    // getExpoPushTokenAsync requiere un EAS Project ID o un Development Build.
    // Para modo desarrollo/demo en Expo Go, generamos un identificador de dispositivo válido:
    console.warn(
      'Expo Push Token remoto no disponible en Expo Go sin EAS Project ID. Usando token de desarrollo para pruebas.',
      error instanceof Error ? error.message : error,
    );
    token = `ExponentPushToken[dev-expo-go-${Platform.OS}]`;
  }

  // Registrar el token (real o de desarrollo) en el backend de NestJS
  if (teacherToken && token) {
    try {
      await axios.post(
        `${BACKEND_URL}/teacher/device-token`,
        { pushToken: token },
        { headers: { Authorization: `Bearer ${teacherToken}` }, timeout: 8000 },
      );
    } catch (apiErr) {
      console.warn('No se pudo sincronizar el token con el backend:', apiErr);
    }
  }

  return token;
}

/**
 * Dispara una notificación local inmediata en el dispositivo para verificar que
 * los permisos y el canal de sonido/vibración funcionan correctamente en Expo Go.
 */
export async function sendLocalTestNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // null indica envío inmediato
  });
}
