import {
  persistProfilePhoto,
  removeProfilePhoto,
} from "@/lib/user-profile";
import {
  ActionSheetIOS,
  Alert,
  InteractionManager,
  Platform,
} from "react-native";

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
    "No se pudo abrir la galería. Cierra la app y ábrela de nuevo."
  );
}

function afterSheet(run: () => Promise<void>) {
  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      void run().catch(() => {
        Alert.alert("Foto", "No se pudo actualizar la imagen.");
      });
    }, 450);
  });
}

async function pickProfilePhoto(): Promise<string | null> {
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
    allowsEditing: false,
    quality: 0.7,
    exif: false,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return persistProfilePhoto(result.assets[0].uri);
}

export async function pickLocalImage(options?: {
  maxBytes?: number;
}): Promise<string | null> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker) {
    pickerUnavailable();
    return null;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Fotos", "Activa el acceso a tu galería para subir el logo.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 0.85,
    exif: false,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  const asset = result.assets[0];
  const maxBytes = options?.maxBytes ?? 5 * 1024 * 1024;
  if (asset.fileSize && asset.fileSize > maxBytes) {
    Alert.alert("Logo", "La imagen no debe superar 5MB.");
    return null;
  }
  return asset.uri;
}

async function takeProfilePhoto(): Promise<string | null> {
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
    allowsEditing: false,
    quality: 0.7,
    exif: false,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return persistProfilePhoto(result.assets[0].uri);
}

export function promptProfilePhoto(onChanged: (uri: string | null) => void) {
  const gallery = () =>
    afterSheet(async () => {
      const uri = await pickProfilePhoto();
      if (uri) onChanged(uri);
    });
  const camera = () =>
    afterSheet(async () => {
      const uri = await takeProfilePhoto();
      if (uri) onChanged(uri);
    });
  const remove = () =>
    afterSheet(async () => {
      await removeProfilePhoto();
      onChanged(null);
    });

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Foto de perfil",
        options: ["Cancelar", "Elegir de la galería", "Tomar foto", "Quitar foto"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 3,
      },
      (index) => {
        if (index === 1) gallery();
        else if (index === 2) camera();
        else if (index === 3) remove();
      }
    );
    return;
  }

  Alert.alert("Foto de perfil", "Elige de dónde quieres tomarla.", [
    { text: "Galería", onPress: gallery },
    { text: "Cámara", onPress: camera },
    { text: "Quitar foto", style: "destructive", onPress: remove },
    { text: "Cancelar", style: "cancel" },
  ]);
}
