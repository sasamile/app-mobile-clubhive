import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSelectedCity, isAuthenticated } from '@/lib/storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let isMounted = true;
    let animationRef: Animated.CompositeAnimation | null = null;

    // Animación de entrada
    if (isMounted) {
      animationRef = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]);
      animationRef.start();
    }

    // Verificar autenticación y redirigir
    const checkAuthAndRedirect = async () => {
      if (!isMounted) return;
      
      const authenticated = await isAuthenticated();
      const city = await getSelectedCity();

      if (!isMounted) return;

      // Si está autenticado y tiene ciudad seleccionada, ir directo a tabs
      if (authenticated && city) {
        router.replace('/(users)/(tabs)');
      } else if (authenticated && !city) {
        // Si está autenticado pero no tiene ciudad, ir a seleccionar ciudad
        router.replace('/(users)/city');
      } else {
        // Si no está autenticado, ir a welcome
        router.replace('/welcome');
      }
    };

    const timer = setTimeout(() => {
      checkAuthAndRedirect();
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (animationRef) {
        animationRef.stop();
      }
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, [fadeAnim, scaleAnim]);

  const primaryColor = Colors[colorScheme ?? 'light'].splash;

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <Image
          source={require('@/assets/logos/tiked.png')}
          style={styles.logo}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
});
