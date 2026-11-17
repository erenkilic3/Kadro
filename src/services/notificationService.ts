import { Platform } from 'react-native';
import * as Device from 'expo-device';
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import Constants from 'expo-constants';

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS === 'android') {
    await setNotificationChannelAsync('default', {
      name: 'Kadro Bildirimleri',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16A34A',
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    return null;
  }

  try {
    const tokenResult = await getExpoPushTokenAsync({ projectId });
    return tokenResult.data;
  } catch (err) {
    console.warn('Expo push token could not be fetched:', err);
    return null;
  }
}

export async function presentLocalNotification(title: string, body: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null,
    });
  } catch {
    // Ignore local scheduling errors in restricted environments
  }
}
