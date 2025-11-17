import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSelectedCity, isAuthenticated } from '@/lib/storage';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const borderColor = isDark ? '#333333' : '#E5E5E5';
  const primaryColor = Colors[colorScheme ?? 'light'].primary;

  // Verificar si el usuario ya está logueado al entrar a esta pantalla
  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const authenticated = await isAuthenticated();
        const city = await getSelectedCity();

        if (authenticated && city) {
          router.replace('/(users)/(tabs)');
        } else if (authenticated && !city) {
          router.replace('/(users)/city');
        }
      };
      checkAuth();
    }, [])
  );

  const handleLogin = () => {
    router.push('/(users)/auth/login-user');
  };

  const handleOrganizer = () => {
    router.push('/(users)/auth/login-user');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
      <StatusBar style="light" />
      
      {/* Imagen superior */}
      <View style={styles.imageContainer}>
        <View style={[styles.imageWrapper, { borderColor: primaryColor }]}>
          <Image
            source={require('@/assets/logos/huevobailando.png')}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        </View>
      </View>

      {/* Texto principal */}
      <View style={styles.textContainer}>
        <Text style={[styles.mainText, { color: '#FFFFFF' }]}>
          Busca y encuentra los mejores eventos de Colombia
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.buttonsContainer}>
        {/* Botón Iniciar Sesión */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={handleLogin}
          activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        {/* Botón Soy organizador */}
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor, backgroundColor: '#FFFFFF' }]}
          onPress={handleOrganizer}
          activeOpacity={0.8}>
          <Text style={[styles.secondaryButtonText, { color: '#000000' }]}>
            Soy organizador
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  imageWrapper: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  mainText: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
  },
  buttonsContainer: {
    paddingBottom: 40,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9333EA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

