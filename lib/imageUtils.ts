import * as FileSystem from 'expo-file-system/legacy';

export async function imageUriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  if (uri.startsWith('data:')) {
    const match = uri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid image data from camera');
    return { mimeType: match[1], base64: match[2] };
  }

  if (uri.startsWith('blob:') && typeof fetch !== 'undefined') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    return { base64, mimeType: blob.type || 'image/jpeg' };
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  const mimeType =
    extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  return { base64, mimeType };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read image'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Could not read image'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(blob);
  });
}
