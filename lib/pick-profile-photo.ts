import {
  persistProfilePhoto,
  removeProfilePhoto,
} from "@/lib/user-profile";
import { Alert } from "react-native";

type ImagePickerModule = typeof import("expo-image-picker");

async function loadImagePicker(): Promise<ImagePickerModule | null> {
  try {
    return await import("expo-image-picker");
  } catch {
    return null;
  }
}

function pickerUnavailable() {
  Alert.alert(
    "Foto de perfil",
    "Para cambiar la foto abre la app con el development build (no Expo Go) y vuelve a intentarlo."
  );
}

export async function pickProfilePhoto(): Promise<string | null> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker) {
    pickerUnavailable();
    return null;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      "Fotos",
      "Activa el acceso a tu galería para cambiar la foto de perfil."
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return persistProfilePhoto(result.assets[0].uri);
}

export async function takeProfilePhoto(): Promise<string | null> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker) {
    pickerUnavailable();
    return null;
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Cámara", "Activa la cámara para tomar tu foto de perfil.");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return persistProfilePhoto(result.assets[0].uri);
}

export function promptProfilePhoto(onChanged: (uri: string | null) => void) {
  Alert.alert("Foto de perfil", "Elige de dónde quieres tomarla.", [
    {
      text: "Galería",
      onPress: () => {
        void pickProfilePhoto()
          .then((uri) => {
            if (uri) onChanged(uri);
          })
          .catch(() => {
            Alert.alert("Foto", "No se pudo guardar la imagen.");
          });
      },
    },
    {
      text: "Cámara",
      onPress: () => {
        void takeProfilePhoto()
          .then((uri) => {
            if (uri) onChanged(uri);
          })
          .catch(() => {
            Alert.alert("Foto", "No se pudo guardar la imagen.");
          });
      },
    },
    {
      text: "Quitar foto",
      style: "destructive",
      onPress: () => {
        void removeProfilePhoto()
          .then(() => onChanged(null))
          .catch(() => {
            Alert.alert("Foto", "No se pudo quitar la imagen.");
          });
      },
    },
    { text: "Cancelar", style: "cancel" },
  ]);
}
