import {supabase} from '../../services/supabaseClient';

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_INPUT_BYTES = 5 * 1024 * 1024;
const AVATAR_SIZE = 256;

/** Center-crops the image to a square, resizes to 256x256 and encodes it as webp. */
export async function cropToSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob) throw new Error('encode');
    return blob;
  } finally {
    bitmap.close();
  }
}

/** Storage object path for a public avatar URL of our bucket, or null when it is external (e.g. Google). */
function ownObjectPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}

/** Uploads a new avatar, points `profiles.avatar_url` at it and removes the previous object. */
export async function uploadAvatar(userId: string, file: File, previousUrl: string | null): Promise<void> {
  if (!supabase) throw new Error('not-configured');
  const blob = await cropToSquareWebp(file);
  // Browsers without webp encoding (e.g. older Safari) silently return png; label the object accordingly.
  const contentType = blob.type || 'image/png';
  const ext = contentType === 'image/webp' ? 'webp' : contentType === 'image/jpeg' ? 'jpg' : 'png';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const {error: upErr} = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, blob, {upsert: true, contentType});
  if (upErr) throw upErr;
  const {data} = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const {error: dbErr} = await supabase.from('profiles').update({avatar_url: data.publicUrl}).eq('id', userId);
  if (dbErr) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    throw dbErr;
  }
  await removeOwnObject(previousUrl);
}

/** Clears `profiles.avatar_url` and deletes the stored object when it is ours. */
export async function removeAvatar(userId: string, currentUrl: string | null): Promise<void> {
  if (!supabase) throw new Error('not-configured');
  const {error} = await supabase.from('profiles').update({avatar_url: null}).eq('id', userId);
  if (error) throw error;
  await removeOwnObject(currentUrl);
}

async function removeOwnObject(url: string | null | undefined): Promise<void> {
  const path = ownObjectPath(url);
  if (path && supabase) await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}
