import api from "@/lib/api";
import {
  getUserData,
  saveUserData,
  type User,
} from "@/lib/storage";
import * as FileSystem from "expo-file-system/legacy";

const PHOTO_FILE = "tiked-profile.jpg";

export function profilePhotoPath(): string | null {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}${PHOTO_FILE}` : null;
}

function gravatarUrl(email: string) {
  return `https://www.gravatar.com/avatar/${encodeURIComponent(
    email.trim().toLowerCase()
  )}?d=identicon&s=200`;
}

export async function resolveProfileImage(
  user: User | null
): Promise<string | null> {
  try {
    const dest = profilePhotoPath();
    if (dest) {
      const info = await FileSystem.getInfoAsync(dest);
      if (info.exists) {
        const stamp =
          "modificationTime" in info && info.modificationTime
            ? info.modificationTime
            : Date.now();
        return `${dest}?t=${stamp}`;
      }
    }
  } catch {
    // Sin FileSystem nativo (p. ej. Expo Go antiguo): caer al email.
  }
  const stored = user?.imageUrl?.trim();
  if (stored) return stored;
  if (user?.email) return gravatarUrl(user.email);
  return null;
}

export async function persistProfilePhoto(sourceUri: string): Promise<string> {
  const dest = profilePhotoPath();
  if (!dest) throw new Error("No hay espacio local para guardar la foto.");

  await FileSystem.deleteAsync(dest, { idempotent: true });
  await FileSystem.copyAsync({ from: sourceUri, to: dest });

  const user = await getUserData();
  if (user) {
    await saveUserData({ ...user, imageUrl: dest });
  }

  return `${dest}?t=${Date.now()}`;
}

export async function removeProfilePhoto(): Promise<void> {
  const dest = profilePhotoPath();
  if (dest) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  }
  const user = await getUserData();
  if (user) {
    const next = { ...user };
    delete next.imageUrl;
    await saveUserData(next);
  }
}

export async function updateCustomerProfile(input: {
  name: string;
  phone: string;
  dni: string;
}): Promise<User> {
  const current = await getUserData();
  if (!current) throw new Error("No hay sesión.");

  const response = await api.put("/customers/update", {
    email: current.email,
    name: input.name.trim(),
    phone: input.phone.trim(),
    dni: input.dni.trim(),
  });

  const data = (response.data ?? {}) as Partial<User>;
  const next: User = {
    ...current,
    name: data.name?.trim() || input.name.trim(),
    phone: data.phone?.trim() || input.phone.trim(),
    dni: data.dni?.trim() || input.dni.trim(),
    email: data.email?.trim() || current.email,
  };

  await saveUserData(next);
  return next;
}
