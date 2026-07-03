import * as FileSystem from 'expo-file-system/legacy';

export async function imageUriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  const mimeType =
    extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  return { base64, mimeType };
}
