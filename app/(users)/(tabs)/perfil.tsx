import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { clearAuthData, getUserData, removeSelectedCity, type User } from '@/lib/storage';

// Obtener URL de Gravatar usando MD5 del email
const getGravatarUrl = async (email: string) => {
  try {
    const emailHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      email.toLowerCase().trim()
    );
    return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=200`;
  } catch (error) {
    console.error('Error generando hash MD5:', error);
    return `https://www.gravatar.com/avatar/${encodeURIComponent(email)}?d=identicon&s=200`;
  }
};

export default function PerfilScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadProfileImage();
    }
  }, [user?.email]);

  const loadUserData = async () => {
    const userData = await getUserData();
    setUser(userData);
  };

  const loadProfileImage = async () => {
    if (user?.email) {
      const url = await getGravatarUrl(user.email);
      setProfileImageUrl(url);
    }
  };

  const handleLogout = async () => {
    try {
      await clearAuthData();
      await removeSelectedCity();
    } finally {
      router.replace('/(users)/auth/login-user');
    }
  };

  const handleLocationPress = () => {
    // Navegar a la pantalla de ubicación o ciudad
    router.push('/(users)/city');
  };

  const handleTermsPress = () => {
    // Abrir términos y condiciones
    // router.push('/(users)/terms');
  };

  const handlePrivacyPress = () => {
    // Abrir políticas de privacidad
    // router.push('/(users)/privacy');
  };

  // Obtener iniciales para el avatar si no hay imagen
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Título */}
        <View style={styles.titleContainer}>
          <ThemedText
            type="title"
            style={[styles.title, { fontFamily: Fonts.rounded }]}>
            Perfil
          </ThemedText>
        </View>

        {/* Tarjeta de perfil */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {profileImageUrl ? (
              <Image
                source={{
                  uri: profileImageUrl,
                }}
                style={styles.profileImage}
                contentFit="cover"
                placeholder={require('@/assets/images/icon.png')}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <ThemedText style={styles.profileImageText}>
                  {user?.name ? getInitials(user.name) : 'U'}
                </ThemedText>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName} numberOfLines={2}>
              {user?.name || 'Usuario'}
            </ThemedText>
            <ThemedText style={styles.profileEmail} numberOfLines={1}>
              {user?.email || 'email@ejemplo.com'}
            </ThemedText>
          </View>
        </View>

        {/* Sección: Mi cuenta */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Mi cuenta</ThemedText>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLocationPress}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="location" size={24} color="#fff" />
              <ThemedText style={styles.menuItemText}>Ubicación</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        </View>

        {/* Sección: Información */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Información</ThemedText>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTermsPress}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text" size={24} color="#fff" />
              <ThemedText style={styles.menuItemText}>Términos y condiciones</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePrivacyPress}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle" size={24} color="#fff" />
              <ThemedText style={styles.menuItemText}>Políticas de privacidad</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out" size={24} color="#fff" />
              <ThemedText style={styles.menuItemText}>Cerrar sesión</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D0D0D0',
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
