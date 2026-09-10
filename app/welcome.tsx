import { getSelectedCity, isAuthenticated } from '@/lib/storage';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = '#7C4DFF';

export default function WelcomeScreen() {
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
      
      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/logos/mascot-qr.webp')}
          style={styles.image}
          contentFit="contain"
        />
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
          style={styles.primaryButton}
          onPress={handleLogin}
          activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
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
    paddingTop: 24,
  },
  image: {
    width: 320,
    height: 360,
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
    backgroundColor: BRAND,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
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

