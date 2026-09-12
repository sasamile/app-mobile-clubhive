import api from "@/lib/api";
import { formatEventTime, unwrapEventPayload } from "@/lib/format-event";
import {
  findTransactionByReference
} from "@/lib/wompi";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ApiEventDetail {
  id: string;
  name: string;
  desc: string;
  time: string;
  date: string;
  state: boolean;
  location: string;
  address: string;
  img: string;
  cityName: string;
}

export default function PaymentProcessingScreen() {
  const params = useLocalSearchParams<{
    eventId: string;
    reference: string;
    id?: string; // transactionId de Wompi
  }>();

  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("Procesando pago...");
  const [eventData, setEventData] = useState<ApiEventDetail | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Cargar datos del evento
    const loadEventData = async () => {
      try {
        const eventResponse = await api.get(`/events/get/${params.eventId}`);
        const event = unwrapEventPayload<ApiEventDetail>(eventResponse.data);
        if (isMounted && event) {
          setEventData(event);
        }
      } catch (error) {
        console.error("Error cargando datos del evento:", error);
      }
    };

    const processPayment = async () => {
      try {

        // Verificar con el backend usando el transactionId
        const verifyPayment = async (
          txId: string,
          retries = 3
        ): Promise<void> => {
          try {
            // Usar el endpoint correcto: /payments/verify?tx={transactionId}
            const response = await api.get(`/payments/verify?tx=${txId}`);

            // Mostrar la respuesta completa de la API en los logs

            if (isMounted) {
              setApiResponse(response.data);
            }

            if (response.data && isMounted) {
              const paymentData = response.data;
              const paymentStatus = paymentData.status;
              const isApproved = paymentData.approved;

             

              if (paymentStatus === "APPROVED" || isApproved === true) {
                // Cargar datos del evento antes de mostrar éxito
                await loadEventData();
                if (isMounted) {
                  setStatus("success");
                  setMessage("¡Pago procesado correctamente!");
                }
                return;
              } else if (paymentStatus === "DECLINED" || isApproved === false) {
                // Pago rechazado
                if (isMounted) {
                  setStatus("error");
                  setMessage("La compra ha sido rechazada");
                }
                return;
              } else if (paymentStatus === "PENDING" && retries > 0) {
                // Pago pendiente, reintentar
                setMessage("Pago pendiente, verificando...");
                setTimeout(() => {
                  if (isMounted) {
                    verifyPayment(txId, retries - 1);
                  }
                }, 2000);
                return;
              }
            }
          } catch (verifyError: any) {
            console.error("❌ Error verificando pago:", verifyError);
            console.log(
              "📦 Respuesta de error:",
              JSON.stringify(
                verifyError?.response?.data || verifyError?.message,
                null,
                2
              )
            );

            // Si falla y aún hay reintentos, intentar de nuevo
            if (retries > 0) {
              setMessage("Reintentando verificación...");
              setTimeout(() => {
                if (isMounted) {
                  verifyPayment(txId, retries - 1);
                }
              }, 2000);
            } else {
              // Después de varios intentos fallidos, mostrar error
              if (isMounted) {
                setStatus("error");
                setMessage("La compra ha sido rechazada");
              }
            }
          }
        };

        // Si hay transactionId en los params (viene de Wompi como 'id')
        const transactionId = params.id;

        // SIEMPRE verificar con el backend primero usando el endpoint /payments/verify
        if (transactionId && isMounted) {
          setMessage("Verificando pago con el servidor...");
          verifyPayment(transactionId);
          return; // Salir después de iniciar la verificación con el backend
        }
        // Si no tenemos transactionId pero tenemos referencia, buscarlo directamente en Wompi
        else if (params.reference && isMounted) {
          setMessage("Buscando transacción en Wompi...");

          try {
            // Buscar la transacción directamente en Wompi usando la referencia
            const transactionResult = await findTransactionByReference(
              params.reference
            );

            if (transactionResult && transactionResult.transactionId) {
            

              // SIEMPRE verificar con el backend usando el endpoint /payments/verify
              // El backend es la fuente de verdad para el estado del pago
              if (isMounted) {
                setMessage("Verificando pago con el servidor...");
                verifyPayment(transactionResult.transactionId);
              }
            } else {
              // No se encontró la transacción en Wompi aún
              

              if (isMounted) {
                setMessage("Esperando confirmación del pago...");
                // Reintentar después de 2 segundos
                setTimeout(() => {
                  if (isMounted) {
                    processPayment();
                  }
                }, 2000);
              }
            }
          } catch (wompiError: any) {
            console.error("Error buscando transacción en Wompi:", wompiError);

            if (isMounted) {
              // Si falla la búsqueda en Wompi, mostrar error
              setStatus("error");
              setMessage(
                "Error al verificar el estado del pago. Por favor contacta soporte."
              );
            }
          }
        } else if (
          !transactionId &&
          !params.reference &&
          !params.id &&
          isMounted
        ) {
          // No hay referencia ni transactionId, mostrar error
          setStatus("error");
          setMessage("No se recibió información del pago");
        }
      } catch (error: any) {
        console.error("Error procesando pago:", error);
        if (isMounted) {
          setStatus("error");
          setMessage(error?.message || "Error al verificar el estado del pago");
        }
      }
    };

    processPayment();

    return () => {
      isMounted = false;
    };
  }, [params.id, params.reference, params.eventId]);

  const handleGoToTickets = () => {
    router.replace({
      pathname: "/(users)/(tabs)/entradas",
    });
  };

  const handleGoToHome = () => {
    router.replace({
      pathname: "/(users)/(tabs)/entradas",
    });
  };

  const formatDate = (dateString: string, timeString: string) => {
    try {
      const date = new Date(dateString);
      const months = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const time = timeString || "00:00";
      return `${day} de ${month} , ${time}`;
    } catch {
      return `${dateString} , ${timeString || "00:00"}`;
    }
  };

  return (
    <>
      {status === "processing" && (
        <>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <SafeAreaView style={styles.container}>
            <View style={styles.processingContent}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={styles.processingMessage}>{message}</Text>
            </View>
          </SafeAreaView>
        </>
      )}

      {status === "success" && (
        <>
          <StatusBar barStyle="dark-content" backgroundColor="#01FE89" />
          <View style={styles.successContainer}>
            {/* Botón de cierre */}
            <TouchableOpacity
              style={[styles.closeButton, { top: insets.top + 10 }]}
              onPress={handleGoToHome}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Ilustración de aprobado */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("@/assets/logos/aproveed.png")}
                style={styles.successImage}
                resizeMode="contain"
              />
            </View>

            {/* Mensaje principal */}
            <Text style={styles.successTitle}>¡ COMPRA EXITOSA !</Text>

            {/* Detalles del evento */}
            {eventData && (
              <View style={styles.eventDetails}>
                <Text style={styles.eventName}>{eventData.name}</Text>
                <Text style={styles.eventDate}>
                  {formatDate(eventData.date, formatEventTime(eventData.time))}
                </Text>
              </View>
            )}

            {/* Botón */}
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleGoToTickets}
            >
              <Text style={styles.successButtonText}>IR A MIS ENTRADAS</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {status === "error" && (
        <>
          <StatusBar barStyle="light-content" backgroundColor="#FF4444" />
          <View style={styles.errorContainer}>
            {/* Botón de cierre */}
            <TouchableOpacity
              style={[styles.closeButtonError, { top: insets.top + 10 }]}
              onPress={handleGoToHome}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.beeContainer}>
              <ExpoImage
                source={require("@/assets/logos/tiked.png")}
                style={styles.errorImage}
                contentFit="contain"
              />
            </View>

            {/* Mensaje principal */}
            <Text style={styles.errorTitle}>¡ LO SENTIMOS !</Text>
            <Text style={styles.errorMessage}>{message}</Text>

            {/* Botón */}
            <TouchableOpacity style={styles.errorButton} onPress={handleGoToHome}>
              <Text style={styles.errorButtonText}>IR AL INICIO</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  processingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 24,
    gap: 24,
  },
  processingMessage: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
  },
  // Estilos para pantalla de éxito (verde claro)
  successContainer: {
    flex: 1,
    backgroundColor: "#01FE89", // Verde
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  illustrationContainer: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  successImage: {
    width: 250,
    height: 250,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#000",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  eventDetails: {
    alignItems: "center",
    marginBottom: 40,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
  },
  successButton: {
    backgroundColor: "#000",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  successButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  // Estilos para pantalla de error (rojo)
  errorContainer: {
    flex: 1,
    backgroundColor: "#FF4444", // Rojo
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeButtonError: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  beeContainer: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorImage: {
    width: 250,
    height: 250,
  },
  errorTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  errorMessage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 40,
  },
  errorButton: {
    backgroundColor: "#000",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  errorButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
