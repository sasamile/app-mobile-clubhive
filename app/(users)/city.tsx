import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/lib/api';
import { saveSelectedCity } from '@/lib/storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface City {
  id: number;
  name: string;
  image?: any; // Placeholder por ahora
}

const CityPages = () => {
  const colorScheme = useColorScheme();
  const primaryColor = Colors[colorScheme ?? 'light'].primary;
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar ciudades del API
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/events/cities');
        const citiesData: City[] = response.data;
        setCities(citiesData);
      } catch (error: any) {
        console.error('Error al cargar ciudades:', error);
        Alert.alert(
          'Error',
          'No se pudieron cargar las ciudades. Por favor, intenta de nuevo.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, []);

  const handleContinue = async () => {
    if (!selectedCity) {
      Alert.alert('Error', 'Por favor selecciona una ciudad');
      return;
    }

    try {
      setIsSaving(true);
      const selectedCityData = cities.find((city) => city.id === selectedCity);
      
      if (selectedCityData) {
        // Guardar la ciudad seleccionada en AsyncStorage
        await saveSelectedCity({
          id: selectedCityData.id,
          name: selectedCityData.name,
        });
        
        // Navegar a la siguiente pantalla
        router.replace('/(users)/(tabs)');
      }
    } catch (error: any) {
      console.error('Error al guardar la ciudad:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar la ciudad seleccionada. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Cargando ciudades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Título principal */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>¿Qué eventos hay cerca a ti?</Text>
          <Text style={styles.subtitle}>
            Selecciona tu ciudad y busca los mejores eventos
          </Text>
        </View>

        {/* Lista de ciudades */}
        <View style={styles.citiesContainer}>
          {cities.map((city) => {
            const isSelected = selectedCity === city.id;
            
            return (
              <TouchableOpacity
                key={city.id}
                style={[
                  styles.cityCard,
                  isSelected && {
                    borderColor: primaryColor,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedCity(city.id)}
                activeOpacity={0.7}>
                
                {/* Imagen circular de la ciudad */}
                <View
                  style={[
                    styles.cityImageContainer,
                    isSelected && { borderColor: primaryColor },
                  ]}>
                  {city.image ? (
                    <Image
                      source={city.image}
                      style={styles.cityImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.cityImagePlaceholder,
                        { backgroundColor: isSelected ? primaryColor : '#2C2C2E' },
                      ]}>
                      <Text style={styles.cityInitial}>
                        {city.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Nombre de la ciudad */}
                <Text style={styles.cityName}>{city.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Botón Continuar - Solo se muestra si hay una ciudad seleccionada */}
      {selectedCity && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: primaryColor },
              isSaving && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>Continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    paddingHorizontal: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  citiesContainer: {
    gap: 16,
    marginBottom: 20,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  cityImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
  },
  continueButton: {
    backgroundColor: '#7C4DFF',
    paddingVertical: 16,
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
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CityPages;