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
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export const BACKEND_URL = 'http://localhost:3000/api/v1';

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

    // Si contamos con sesión de docente, registrar el token en el backend
    if (teacherToken && token) {
      await axios.post(
        `${BACKEND_URL}/teacher/device-token`,
        { token },
        { headers: { Authorization: `Bearer ${teacherToken}` } },
      );
    }
  } catch (error) {
    console.error('Error al obtener o registrar Expo Push Token:', error);
  }

  return token;
}
