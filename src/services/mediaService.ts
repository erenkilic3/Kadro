import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

export type MediaBucket = 'avatars' | 'gear-images';

export interface PickedImageAsset {
  uri: string;
  mimeType: string;
}

export async function pickImageFromLibrary(): Promise<{
  asset?: PickedImageAsset;
  error?: string;
}> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Fotoğraf seçebilmek için galeri erişim izni gerekiyor.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return {};
  }

  const selected = result.assets[0];
  if (!selected.uri) {
    return { error: 'Seçilen görselin dosya yolu alınamadı.' };
  }

  return {
    asset: {
      uri: selected.uri,
      mimeType: selected.mimeType || 'image/jpeg',
    },
  };
}

export async function uploadImageToBucket(
  bucket: MediaBucket,
  userId: string,
  asset: PickedImageAsset
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase istemcisi yapılandırılmamış.');
  }

  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const rawExt = asset.mimeType.split('/')[1]?.toLowerCase() || 'jpeg';
  const ext = rawExt === 'jpg' ? 'jpeg' : rawExt;
  const normalizedMime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const filePath = `${userId}/${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, arrayBuffer, {
      contentType: normalizedMime,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
