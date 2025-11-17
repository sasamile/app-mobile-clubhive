import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Entrada = {
  id: number;
  eventName: string;
  eventDescription: string;
  artist?: string;
  date: string;
  supports?: string[];
  ticketCount: number;
  imageType: 'sunset' | 'forest';
  ticketType: string;
  price: string;
  fullDate: string;
  fullEventName: string;
  venue?: string;
  address?: string;
  time?: string;
  rsvp?: string;
  artists?: string[];
  eventDate?: string;
  eventLabel?: string;
};

export default function EntradasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryColor = Colors[colorScheme ?? 'light'].primary;
  const [selectedTicket, setSelectedTicket] = useState<Entrada | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Datos de ejemplo de entradas
  const entradas: Entrada[] = [
    {
      id: 1,
      eventName: 'Bandidos',
      eventDescription: 'Bandidos - Evento de fin de año',
      artist: 'RAFA BARRIOS',
      date: '31 de diciembre, 22:00 p.m',
      supports: ['US SYROSSIAN', 'RAFA BARRIOS', 'SIDNEY CHARLES', 'DAMELO VILLA'],
      ticketCount: 1,
      imageType: 'sunset', // Para el gradiente de atardecer
      ticketType: 'Entrada General',
      price: '$28.800',
      fullDate: '01 de diciembre, 08:00 P.M',
      fullEventName: 'Parrando llanero con ...',
    },
    {
      id: 2,
      eventName: 'Festival Technasia (Día 1)',
      eventDescription: 'Festival Technasia (Día 1)',
      date: '24 de marzo, 18:00 p.m',
      venue: 'ODE MIAMI',
      address: 'MIAMI AVENUE',
      time: 'FROM 10PM-5AM',
      rsvp: 'RSVP: 305-942-7240',
      artists: ['TECHNASIA', 'ANDREA QUINTERO', 'SALVARDOR PARRA B2B CAIO HARA'],
      eventDate: 'FRIDAY MARCH 22ND, 2024',
      eventLabel: 'MIAMI MUSIC WEEK',
      ticketCount: 2,
      imageType: 'forest', // Para el gradiente de bosque
      ticketType: 'Entrada General',
      price: '$28.800',
      fullDate: '01 de diciembre, 08:00 P.M',
      fullEventName: 'Parrando llanero con ...',
    },
  ];

  const handleTicketPress = (entrada: Entrada) => {
    setSelectedTicket(entrada);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedTicket(null);
  };

  const renderEventCard = (entrada: Entrada) => {
    return (
      <TouchableOpacity
        key={entrada.id}
        style={styles.eventCard}
        onPress={() => handleTicketPress(entrada)}
        activeOpacity={0.8}>
        {/* Imagen superior con gradiente */}
        <View style={styles.imageContainer}>
          {entrada.imageType === 'sunset' ? (
            <LinearGradient
              colors={['#6B21A8', '#9333EA', '#F59E0B', '#FBBF24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientImage}>
              {/* Siluetas de palmeras y pájaros - representación simplificada */}
              <View style={styles.imageContent}>
                <Text style={styles.artistName}>{entrada.artist}</Text>
                <Text style={styles.presentsText}>PRESENTS</Text>
                <Text style={styles.eventTitleImage}>{entrada.eventName.toUpperCase()}</Text>
                <Text style={styles.dateTextImage}>THURSDAY MARCH 21st 2024</Text>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#1E3A2F', '#2D4A3F', '#1A2E28']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientImage}>
              <View style={styles.imageContent}>
                <Text style={styles.dateTextImageDark}>{entrada.eventDate}</Text>
                <Text style={styles.labelTextImage}>{entrada.eventLabel}</Text>
                <Text style={styles.artistNameDark}>{entrada.artists?.[0]}</Text>
                <Text style={styles.artistNameDarkSmall}>{entrada.artists?.[1]}</Text>
                <Text style={styles.artistNameDarkSmaller}>{entrada.artists?.[2]}</Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Información del evento */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{entrada.eventDescription}</Text>
          
          {entrada.supports && (
            <View style={styles.supportsContainer}>
              {entrada.supports.map((support, index) => (
                <Text key={index} style={styles.supportText}>
                  {support}
                </Text>
              ))}
            </View>
          )}

          {entrada.venue && (
            <View style={styles.venueContainer}>
              <Text style={styles.venueText}>{entrada.venue}</Text>
              <Text style={styles.venueText}>{entrada.address}</Text>
              <Text style={styles.venueText}>{entrada.time}</Text>
              <Text style={styles.venueText}>{entrada.rsvp}</Text>
            </View>
          )}

          <Text style={[styles.eventDate, { color: primaryColor }]}>{entrada.date}</Text>
        </View>

        {/* Badge de número de entradas */}
        <View style={styles.ticketBadge}>
          <Text style={styles.ticketCount}>{entrada.ticketCount}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQRCode = () => {
    // Generar un código único para el ticket
    const qrValue = selectedTicket
      ? `TICKET-${selectedTicket.id}-${selectedTicket.eventName}-${Date.now()}`
      : 'TICKET-DEFAULT';
    
    // Usar API para generar QR code como imagen
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}&bgcolor=FFFFFF&color=000000`;
    
    return (
      <View style={styles.qrCodeContainer}>
        <Image
          source={{ uri: qrUrl }}
          style={styles.qrCodeImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Entradas
          </ThemedText>
        </View>

        {/* Lista de entradas */}
        {entradas.map(entrada => renderEventCard(entrada))}
      </ScrollView>

      {/* Modal del ticket */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Contenido del ticket */}
            <View style={styles.ticketCard}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Mi entrada</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {/* QR Code */}
              <View style={styles.qrSection}>
                {renderQRCode()}
              </View>

              {/* Línea punteada divisoria */}
              <View style={styles.dashedLineContainer}>
                <View style={styles.dashedLineLeft} />
                <View style={styles.dashedLine}>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <View key={i} style={styles.dash} />
                  ))}
                </View>
                <View style={styles.dashedLineRight} />
              </View>

              {/* Información del evento */}
              <View style={styles.ticketInfo}>
                <View style={styles.ticketInfoRow}>
                  {/* Imagen pequeña del evento */}
                  <View style={styles.eventThumbnail}>
                    <LinearGradient
                      colors={['#F59E0B', '#FBBF24', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.thumbnailGradient}>
                      <Text style={styles.thumbnailText}>PARRANDO</Text>
                      <Text style={styles.thumbnailText}>LLANERO</Text>
                      <Text style={styles.thumbnailDate}>11 OCTUBRE</Text>
                    </LinearGradient>
                  </View>

                  {/* Información del evento */}
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {selectedTicket?.fullEventName || selectedTicket?.eventDescription}
                    </Text>
                    <Text style={[styles.eventDateText, { color: primaryColor }]}>
                      {selectedTicket?.fullDate || selectedTicket?.date}
                    </Text>
                    <Text style={styles.ticketTypeText}>
                      {selectedTicket?.ticketType} - {selectedTicket?.price}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 10,
  },
  header: {
    marginBottom: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketCard: {
    width: '100%',
    backgroundColor: '#2F2F2F',
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  qrSection: {
    width: '100%',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F2F2F',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  dashedLineContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 20,
    marginVertical: 10,
    alignItems: 'center',
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    flexDirection: 'row',
    height: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    width: 8,
    height: 2,
    backgroundColor: '#666666',
    marginHorizontal: 2,
  },
  dashedLineLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    marginLeft: -10,
    zIndex: 1,
  },
  dashedLineRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    marginRight: -10,
    zIndex: 1,
  },
  ticketInfo: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  ticketInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    overflow: 'hidden',
  },
  thumbnailGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  thumbnailText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  thumbnailDate: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  eventDateText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  ticketTypeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  eventCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#1F1F1F',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  gradientImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContent: {
    width: '100%',
    alignItems: 'center',
  },
  artistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  presentsText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  eventTitleImage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#9333EA',
    marginBottom: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  dateTextImage: {
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  dateTextImageDark: {
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  labelTextImage: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  artistNameDark: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D1D5DB',
    marginBottom: 4,
    letterSpacing: 1,
  },
  artistNameDarkSmall: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  artistNameDarkSmaller: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    letterSpacing: 0.5,
  },
  eventInfo: {
    padding: 16,
    backgroundColor: '#1F1F1F',
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  supportsContainer: {
    marginBottom: 12,
  },
  supportText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  venueContainer: {
    marginBottom: 12,
  },
  venueText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  ticketBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#2F2F2F',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

