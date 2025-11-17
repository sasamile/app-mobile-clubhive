import api from "@/lib/api";
import { getUserData, isAuthenticated } from "@/lib/storage";
import { createWompiPaymentUrl, findTransactionByReference } from "@/lib/wompi";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { NativeModulesProxy } from "expo-modules-core";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Completar sesión de autenticación web si es necesario
WebBrowser.maybeCompleteAuthSession();

interface Ticket {
  id: number;
  name: string;
  desc: string;
  price: number;
  qua: number;
  eventId: string;
  state: boolean;
  available: number;
  sold?: number;
}

interface ApiEventDetail {
  id: string;
  name: string;
  tickets: Ticket[];
  promoters: Array<{
    id: number;
    code: string;
    name: string;
    eventId: number;
  }>;
}

interface SelectedTicket {
  ticket: Ticket;
  quantity: number;
}

export default function TicketsScreen() {
  const params = useLocalSearchParams<{
    id: string;
  }>();

  const [eventData, setEventData] = useState<ApiEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoterCode, setPromoterCode] = useState("");
  const [serviceCost, setServiceCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isPromoterValid, setIsPromoterValid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const paymentSlideAnim = React.useRef(new Animated.Value(0)).current;
  const paymentReferenceRef = useRef<string | null>(null);
  const paymentEventIdRef = useRef<string | null>(null);
  const browserPollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasNativeBlur = !!(NativeModulesProxy as any)?.ExpoBlurView;
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadEventData = async () => {
      if (!params.id) {
        Alert.alert("Error", "ID del evento no encontrado");
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get(`/events/get/${params.id}`);
        const event: ApiEventDetail = response.data;
        setEventData(event);
      } catch (error: any) {
        console.error("Error al cargar evento:", error);
        Alert.alert(
          "Error",
          "No se pudo cargar la información del evento. Por favor, intenta de nuevo.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
  }, [params.id]);

  useEffect(() => {
    if (eventData) {
      calculateTotal();
    }
  }, [selectedTickets, promoterCode, eventData]);

  // Listener para deep links cuando el usuario vuelve de la web
  useEffect(() => {
    const subscription = Linking.addEventListener("url", async (event) => {
      
      // Verificar si es la URL de procesamiento de pago (deep link o URL web)
      const isProcessingUrl = 
        event.url.includes("payment/processing") || 
        event.url.includes("/processing") ||
        event.url.includes("clubhive.co/processing");
      
      if (isProcessingUrl) {
        try {
          // Parsear la URL
          let urlString = event.url;
          
          // Si es un deep link, convertir a formato URL estándar
          if (urlString.startsWith("clubhive://")) {
            urlString = urlString.replace("clubhive://", "https://");
          }
          
          // Si es una URL web completa, usarla directamente
          const url = new URL(urlString);
          const eventId = url.searchParams.get("eventId");
          const reference = url.searchParams.get("reference");
          const transactionId = url.searchParams.get("id");


          if (eventId && reference) {
            
            // Cerrar el navegador si está abierto
            try {
              await WebBrowser.dismissBrowser();
            } catch (e) {
              console.log("Navegador ya cerrado o no estaba abierto");
            }
            
            // Limpiar referencias
            paymentReferenceRef.current = null;
            paymentEventIdRef.current = null;
            
            // Redirigir a la pantalla de procesamiento con el transactionId si está disponible
            router.push({
              pathname: "/(users)/payment/processing",
              params: {
                eventId,
                reference,
                ...(transactionId && { id: transactionId }),
              },
            });
          }
        } catch (error) {
          console.error("Error parseando URL:", error);
        }
      }
    });

    // También verificar si la app se abrió con un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        if (url.includes("payment/processing") || url.includes("/processing")) {
          try {
            let urlString = url;
            if (urlString.startsWith("clubhive://")) {
              urlString = urlString.replace("clubhive://", "https://");
            }
            const urlObj = new URL(urlString);
            const eventId = urlObj.searchParams.get("eventId");
            const reference = urlObj.searchParams.get("reference");
            const transactionId = urlObj.searchParams.get("id");

            if (eventId && reference) {
              router.push({
                pathname: "/(users)/payment/processing",
                params: {
                  eventId,
                  reference,
                  ...(transactionId && { id: transactionId }),
                },
              });
            }
          } catch (error) {
            console.error("Error parseando URL inicial:", error);
          }
        }
      }
    });

    return () => {
      subscription.remove();
      // Limpiar polling si existe
      if (browserPollingIntervalRef.current) {
        clearInterval(browserPollingIntervalRef.current);
        browserPollingIntervalRef.current = null;
      }
    };
  }, []);

  const calculateTotal = () => {
    let subtotal = 0;
    selectedTickets.forEach((item) => {
      subtotal += item.ticket.price * item.quantity;
    });

    // Calcular costo de servicio (10% del subtotal)
    const service = Math.round(subtotal * 0.1);
    setServiceCost(service);

    // Aplicar descuento si hay código de promotor válido
    let discountAmount = 0;
    let isValid = false;
    if (promoterCode && eventData?.promoters) {
      const promoter = eventData.promoters.find(
        (p) => p.code.toUpperCase() === promoterCode.toUpperCase()
      );
      if (promoter) {
        // Descuento del 5% si hay código válido
        discountAmount = Math.round(subtotal * 0.05);
        isValid = true;
      }
    }
    setDiscount(discountAmount);
    setIsPromoterValid(isValid);

    const finalTotal = subtotal + service - discountAmount;
    setTotal(finalTotal);
  };

  const handleTicketPress = (ticket: Ticket) => {
    const existing = selectedTickets.find((st) => st.ticket.id === ticket.id);
    if (existing) {
      setCurrentTicket(ticket);
      setQuantity(existing.quantity);
    } else {
      setCurrentTicket(ticket);
      setQuantity(1);
    }
    openModal();
  };

  const handleSaveTicket = () => {
    if (!currentTicket) return;

    if (quantity > currentTicket.available) {
      Alert.alert("Error", "No hay suficientes entradas disponibles");
      return;
    }

    if (quantity > 10) {
      Alert.alert("Error", "No puedes seleccionar más de 10 entradas");
      return;
    }

    if (quantity <= 0) {
      Alert.alert("Error", "Debes seleccionar al menos 1 entrada");
      return;
    }

    // Solo permitir un tipo de ticket
    setSelectedTickets([{ ticket: currentTicket, quantity }]);

    // Cerrar modal de selección
    closeModal();

    // Calcular valores para el modal de pago
    const subtotal = currentTicket.price * quantity;
    const service = Math.round(subtotal * 0.1);
    let discountAmount = 0;
    if (promoterCode && eventData?.promoters) {
      const promoter = eventData.promoters.find(
        (p) => p.code.toUpperCase() === promoterCode.toUpperCase()
      );
      if (promoter) {
        discountAmount = Math.round(subtotal * 0.05);
      }
    }
    const finalTotal = subtotal + service - discountAmount;

    setServiceCost(service);
    setDiscount(discountAmount);
    setTotal(finalTotal);

    // Mostrar modal de pago
    setTimeout(() => {
      openPaymentModal();
    }, 300);
  };

  const handleRemoveTicket = (ticketId: number) => {
    setSelectedTickets(selectedTickets.filter((st) => st.ticket.id !== ticketId));
  };

  const handleQuantityChange = (delta: number) => {
    if (!currentTicket) return;
    const newQuantity = quantity + delta;
    const maxQuantity = Math.min(currentTicket.available, 10);
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const openModal = () => {
    setIsModalVisible(true);
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
      setCurrentTicket(null);
      setQuantity(1);
    });
  };

  const openPaymentModal = () => {
    setIsPaymentModalVisible(true);
    paymentSlideAnim.setValue(0);
    Animated.spring(paymentSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const closePaymentModal = () => {
    Animated.timing(paymentSlideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsPaymentModalVisible(false);
    });
  };

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString("es-CO")}`;
  };

  const processPayment = async () => {
    if (isProcessingPayment || selectedTickets.length === 0) return;

    try {
      setIsProcessingPayment(true);

      // Verificar autenticación
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        Alert.alert(
          "Autenticación requerida",
          "Debes iniciar sesión para realizar una compra",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Iniciar sesión",
              onPress: () => {
                router.push("/(users)/auth/login-user");
              },
            },
          ]
        );
        setIsProcessingPayment(false);
        return;
      }

      // Obtener datos del usuario
      const user = await getUserData();
      if (!user) {
        Alert.alert("Error", "No se pudo obtener la información del usuario");
        setIsProcessingPayment(false);
        return;
      }

      const selectedTicket = selectedTickets[0];
      if (!selectedTicket) {
        Alert.alert("Error", "No hay ticket seleccionado");
        setIsProcessingPayment(false);
        return;
      }

      // 1️⃣ Registrar la venta en el backend
      const payload: {
        details: Array<{ ticket: { id: number }; quantity: number }>;
        source: string;
        promoterCode?: string;
      } = {
        details: [
          {
            ticket: { id: selectedTicket.ticket.id },
            quantity: selectedTicket.quantity,
          },
        ],
        source: "MOBILE",
      };

      // Agregar promoterCode solo si existe y es válido
      if (promoterCode && isPromoterValid) {
        payload.promoterCode = promoterCode;
      }

      console.log("📦 Registrando venta:", payload);
      const { data } = await api.post("/sales/register", payload);
      const { reference, total: backendTotal, owner } = data;


      // Guardar referencia para el listener de deep links
      paymentReferenceRef.current = reference;
      paymentEventIdRef.current = params.id;

      // 2️⃣ Generar URL de pago con Wompi
      // Wompi requiere una URL HTTP/HTTPS válida, no deep links
      // La página web debe redirigir a: clubhive://payment/processing?eventId=...&reference=...
      const redirectUrl = `https://clubhive.co/processing?eventId=${params.id}&reference=${reference}`;
      

      const result = await createWompiPaymentUrl(
        backendTotal,
        reference,
        owner.email || user.email,
        redirectUrl,
        {
          fullName: owner.name || user.name || "",
          phoneNumber: owner.phone || user.phone || "",
        }
      );

      console.log("🔗 URL de Wompi generada:", result);

      // 3️⃣ Abrir URL de Wompi en modal emergente (como Google)
      if (result.paymentUrl) {
        // Cerrar el modal de pago antes de abrir el browser
        closePaymentModal();
        
        // Pequeño delay para que el modal se cierre suavemente
        await new Promise((resolve) => setTimeout(resolve, 400));
        
        // Abrir en modal emergente
        try {
          
          // Iniciar polling para verificar el estado del pago mientras el navegador está abierto
          // Esto nos permite detectar cuando el pago se completa y cerrar el navegador
          const startPolling = () => {
            if (browserPollingIntervalRef.current) {
              clearInterval(browserPollingIntervalRef.current);
            }
            
            let pollCount = 0;
            // Polling por 10 minutos (600 segundos) - cada 2 segundos = 300 polls
            // Esto da suficiente tiempo al usuario para completar el pago
            const maxPolls = 300; // 10 minutos totales
            
            browserPollingIntervalRef.current = setInterval(async () => {
              pollCount++;
              
              if (!paymentReferenceRef.current || !paymentEventIdRef.current) {
                if (browserPollingIntervalRef.current) {
                  clearInterval(browserPollingIntervalRef.current);
                  browserPollingIntervalRef.current = null;
                }
                return;
              }
              
              try {
                // Buscar la transacción directamente en Wompi usando la referencia
                const transactionResult = await findTransactionByReference(paymentReferenceRef.current);
                
                if (transactionResult && transactionResult.transactionId) {
                  const transactionId = transactionResult.transactionId;
                  const wompiStatus = transactionResult.status;
                  
                  console.log(`🔄 Polling ${pollCount}/${maxPolls} - Estado Wompi:`, wompiStatus, "TransactionId:", transactionId);
                  
                  // Si el pago fue aprobado, cerrar el navegador y redirigir
                  if (wompiStatus === "APPROVED") {
                    console.log("✅ Pago aprobado detectado en Wompi, cerrando navegador...");
                    
                    // Limpiar polling
                    if (browserPollingIntervalRef.current) {
                      clearInterval(browserPollingIntervalRef.current);
                      browserPollingIntervalRef.current = null;
                    }
                    
                    // Cerrar el navegador
                    try {
                      await WebBrowser.dismissBrowser();
                    } catch (e) {
                      console.log("Navegador ya cerrado");
                    }
                    
                    // Redirigir a la pantalla de procesamiento con el transactionId
                    const currentRef = paymentReferenceRef.current;
                    const currentEventId = paymentEventIdRef.current;
                    
                    paymentReferenceRef.current = null;
                    paymentEventIdRef.current = null;
                    
                    router.push({
                      pathname: "/(users)/payment/processing",
                      params: {
                        eventId: currentEventId,
                        reference: currentRef,
                        id: transactionId,
                      },
                    });
                  } else if (
                    wompiStatus === "DECLINED" ||
                    wompiStatus === "VOIDED" ||
                    wompiStatus === "FAILED"
                  ) {
                    // Pago rechazado, cerrar navegador y mostrar error
                    console.log("❌ Pago rechazado detectado en Wompi");
                    
                    if (browserPollingIntervalRef.current) {
                      clearInterval(browserPollingIntervalRef.current);
                      browserPollingIntervalRef.current = null;
                    }
                    
                    try {
                      await WebBrowser.dismissBrowser();
                    } catch (e) {
                      console.log("Navegador ya cerrado");
                    }
                    
                    const currentRef = paymentReferenceRef.current;
                    const currentEventId = paymentEventIdRef.current;
                    
                    paymentReferenceRef.current = null;
                    paymentEventIdRef.current = null;
                    
                    router.push({
                      pathname: "/(users)/payment/processing",
                      params: {
                        eventId: currentEventId,
                        reference: currentRef,
                        id: transactionId,
                      },
                    });
                  }
                  // Si el estado es PENDING, continuar polling
                } else {
                  // Transacción no encontrada aún, continuar polling
                  if (pollCount % 10 === 0) {
                    console.log(`⚠️ Transacción no encontrada en Wompi aún (poll ${pollCount}/${maxPolls})`);
                  }
                }
              } catch (pollError: any) {
                // Si hay error, continuar polling (puede ser que el backend aún no haya actualizado)
                if (pollCount % 10 === 0) {
                  console.log(`⚠️ Error en polling ${pollCount}:`, pollError?.response?.status || pollError?.message);
                }
              }
              
              // Si llegamos al máximo de polls, cerrar el navegador y verificar manualmente
              if (pollCount >= maxPolls) {
                
                if (browserPollingIntervalRef.current) {
                  clearInterval(browserPollingIntervalRef.current);
                  browserPollingIntervalRef.current = null;
                }
                
                try {
                  await WebBrowser.dismissBrowser();
                } catch (e) {
                  console.log("Navegador ya cerrado");
                }
                
                const currentRef = paymentReferenceRef.current;
                const currentEventId = paymentEventIdRef.current;
                
                paymentReferenceRef.current = null;
                paymentEventIdRef.current = null;
                
                router.push({
                  pathname: "/(users)/payment/processing",
                  params: {
                    eventId: currentEventId,
                    reference: currentRef,
                  },
                });
              }
            }, 2000); // Polling cada 2 segundos (reduce carga del servidor y da más tiempo al usuario)
          };
          
          // Iniciar polling después de un pequeño delay
          setTimeout(() => {
            startPolling();
          }, 2000);
          
          const browserResult = await WebBrowser.openBrowserAsync(
            result.paymentUrl,
            {
              presentationStyle:
                WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
              controlsColor: "#7c3aed",
              toolbarColor: "#000000",
              enableBarCollapsing: false,
              showInRecents: true,
            }
          );

          
          // Limpiar polling cuando el browser se cierra
          if (browserPollingIntervalRef.current) {
            clearInterval(browserPollingIntervalRef.current);
            browserPollingIntervalRef.current = null;
          }

          // Si el browser se cerró manualmente (OK), verificar el estado
          setTimeout(async () => {
            if (paymentReferenceRef.current === reference && paymentEventIdRef.current) {
              
              const currentRef = paymentReferenceRef.current;
              const currentEventId = paymentEventIdRef.current;
              
              paymentReferenceRef.current = null;
              paymentEventIdRef.current = null;
              
              router.push({
                pathname: "/(users)/payment/processing",
                params: {
                  eventId: currentEventId,
                  reference: currentRef,
                },
              });
            }
          }, 500);
        } catch (browserError: any) {
          console.error("❌ Error abriendo browser:", browserError);
          Alert.alert(
            "Error",
            "No se pudo abrir la página de pago. Por favor intenta de nuevo.",
            [{ text: "OK" }]
          );
        }
      } else {
        throw new Error("No se recibió la URL de pago");
      }
    } catch (err: any) {
      console.error("❌ Error al procesar el pago:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Error procesando el pago. Por favor intenta de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Cargando tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No se encontró el evento</Text>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = selectedTickets.reduce(
    (sum, item) => sum + item.ticket.price * item.quantity,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tickets</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Lista de tickets */}
        <View style={styles.ticketsContainer}>
          {eventData.tickets
            .filter((ticket) => ticket.state && ticket.available > 0)
            .map((ticket) => {
              const selected = selectedTickets.find(
                (st) => st.ticket.id === ticket.id
              );
              return (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => handleTicketPress(ticket)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ticket-outline" size={24} color="#FFFFFF" />
                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketName}>{ticket.name}</Text>
                    <Text style={styles.ticketAvailable}>Disponible</Text>
                  </View>
                  <Text style={styles.ticketPrice}>{formatPrice(ticket.price)}</Text>
                </TouchableOpacity>
              );
            })}
        </View>

   

      </ScrollView>

      {/* Footer con botón de pago */}
      {selectedTickets.length > 0 && (
        <View style={styles.footerContainer}>
          <View
            style={[
              styles.footer,
              {
                paddingBottom: insets?.bottom || 0,
              },
            ]}
          >
            {hasNativeBlur ? (
              <>
                <BlurView
                  intensity={50}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.footerOverlay} />
              </>
            ) : (
              <LinearGradient
                colors={["rgba(0, 0, 0, 0.6)", "rgba(30, 30, 30, 0.85)"]}
                style={StyleSheet.absoluteFill}
              />
            )}
         
          </View>
        </View>
      )}

      {/* Modal para seleccionar cantidad */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeModal}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalBackground} />
            {hasNativeBlur ? (
              <>
                <BlurView
                  intensity={50}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.modalOverlayBlur} />
              </>
            ) : null}
            <ScrollView
              style={styles.modalInner}
              contentContainerStyle={styles.modalInnerContent}
              showsVerticalScrollIndicator={false}
            >
              {currentTicket && (
                <>
                  <Text style={styles.modalTitle}>{currentTicket.name}</Text>
                  <Text style={styles.modalDesc}>{currentTicket.desc}</Text>
                  <Text style={styles.modalPrice}>
                    {formatPrice(currentTicket.price)} cada uno
                  </Text>

                  <View style={styles.modalQuantityContainer}>
                    <Text style={styles.modalQuantityLabel}>Cantidad</Text>
                    <View style={styles.modalQuantitySelector}>
                      <TouchableOpacity
                        style={styles.modalQuantityButton}
                        onPress={() => handleQuantityChange(-1)}
                      >
                        <Text style={styles.modalQuantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalQuantityText}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.modalQuantityButton}
                        onPress={() => handleQuantityChange(1)}
                      >
                        <Text style={styles.modalQuantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalAvailable}>
                      Disponibles: {currentTicket.available} (máximo 10 por compra)
                    </Text>
                  </View>

                  {/* Código de promotor en el modal */}
                  <View style={styles.modalPromoterContainer}>
                    <Text style={styles.modalPromoterLabel}>
                      Código de promotor
                    </Text>
                    <TouchableOpacity
                      style={styles.modalPromoterInput}
                      onPress={() => {
                        Alert.prompt(
                          "Código de promotor",
                          "Ingresa el código de promotor",
                          [
                            {
                              text: "Cancelar",
                              style: "cancel",
                            },
                            {
                              text: "Aplicar",
                              onPress: (code: string | undefined) => {
                                if (code && code.trim()) {
                                  const trimmedCode = code.trim();
                                  setPromoterCode(trimmedCode);
                                  // Validar código
                                  if (eventData?.promoters) {
                                    const promoter = eventData.promoters.find(
                                      (p) =>
                                        p.code.toUpperCase() ===
                                        trimmedCode.toUpperCase()
                                    );
                                    if (!promoter) {
                                      Alert.alert(
                                        "Código inválido",
                                        "El código de promotor ingresado no es válido."
                                      );
                                    }
                                  }
                                } else {
                                  setPromoterCode("");
                                }
                              },
                            },
                          ],
                          "plain-text",
                          promoterCode
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.modalPromoterText,
                          !promoterCode && styles.modalPromoterPlaceholder,
                        ]}
                      >
                        {promoterCode || "Ingresa código de promotor"}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    {promoterCode && isPromoterValid && (
                      <Text style={styles.modalPromoterValid}>
                        ✓ Código válido - Descuento aplicado
                      </Text>
                    )}
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={closeModal}
                    >
                      <Text style={styles.modalCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalSaveButton}
                      onPress={handleSaveTicket}
                    >
                      <Text style={styles.modalSaveText}>Agregar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Modal de confirmación de pago */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="none"
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: paymentSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closePaymentModal}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: paymentSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalBackground} />
            {hasNativeBlur ? (
              <>
                <BlurView
                  intensity={50}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.modalOverlayBlur} />
              </>
            ) : null}
            <ScrollView
              style={styles.modalInner}
              contentContainerStyle={styles.modalInnerContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedTickets.length > 0 && (
                <>
                  <Text style={styles.modalTitle}>Resumen de compra</Text>

                  {selectedTickets.map((item) => (
                    <View key={item.ticket.id} style={styles.paymentSummaryRow}>
                      <View style={styles.paymentTicketInfo}>
                        <Text style={styles.paymentTicketName}>
                          {item.ticket.name}
                        </Text>
                        <Text style={styles.paymentTicketQuantity}>
                          {item.quantity} x {formatPrice(item.ticket.price)}
                        </Text>
                      </View>
                      <Text style={styles.paymentTicketTotal}>
                        {formatPrice(item.ticket.price * item.quantity)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.paymentDivider} />

                  <View style={styles.paymentCostRow}>
                    <Text style={styles.paymentCostLabel}>Subtotal</Text>
                    <Text style={styles.paymentCostValue}>
                      {formatPrice(
                        selectedTickets.reduce(
                          (sum, item) =>
                            sum + item.ticket.price * item.quantity,
                          0
                        )
                      )}
                    </Text>
                  </View>

                  <View style={styles.paymentCostRow}>
                    <Text style={styles.paymentCostLabel}>Costo de servicio</Text>
                    <Text style={styles.paymentCostValue}>
                      {formatPrice(serviceCost)}
                    </Text>
                  </View>

                  {discount > 0 && (
                    <View style={styles.paymentCostRow}>
                      <Text
                        style={[
                          styles.paymentCostLabel,
                          styles.paymentDiscountLabel,
                        ]}
                      >
                        Descuento (promotor)
                      </Text>
                      <Text
                        style={[
                          styles.paymentCostValue,
                          styles.paymentDiscountValue,
                        ]}
                      >
                        -{formatPrice(discount)}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.paymentCostRow, styles.paymentTotalRow]}>
                    <Text style={styles.paymentTotalLabel}>TOTAL</Text>
                    <Text style={styles.paymentTotalValue}>
                      {formatPrice(total)}
                    </Text>
                  </View>

                  {promoterCode && (
                    <View style={styles.paymentPromoterInfo}>
                      <Text style={styles.paymentPromoterLabel}>
                        Código aplicado:
                      </Text>
                      <Text style={styles.paymentPromoterCode}>
                        {promoterCode}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[
                        styles.modalSaveButton,
                        isProcessingPayment && styles.modalSaveButtonDisabled,
                      ]}
                      onPress={processPayment}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.modalSaveText}>
                          PAGAR: {formatPrice(total)} COP
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 36,
  },
  ticketsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  ticketAvailable: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.6,
  },
  ticketPrice: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  quantityText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
  },
  costValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  discountLabel: {
    color: "#4ade80",
  },
  discountValue: {
    color: "#4ade80",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  totalValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  promoterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  promoterRowValid: {
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
  },
  promoterLeft: {
    flex: 1,
  },
  promoterLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  promoterCode: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "600",
  },
  footerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    position: "relative",
  },
  footerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  payButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    zIndex: 1,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: "80%",
    width: "100%",
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#252525",
  },
  modalOverlayBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalInner: {
    zIndex: 1,
  },
  modalInnerContent: {
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },
  modalDesc: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
  },
  modalPrice: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
  },
  modalQuantityContainer: {
    marginBottom: 24,
  },
  modalQuantityLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalQuantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 8,
  },
  modalQuantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalQuantityButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  modalQuantityText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    minWidth: 60,
    textAlign: "center",
  },
  modalAvailable: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },
  modalPromoterContainer: {
    marginBottom: 24,
  },
  modalPromoterLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalPromoterInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalPromoterText: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  modalPromoterPlaceholder: {
    opacity: 0.5,
  },
  modalPromoterValid: {
    color: "#4ade80",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#7c3aed",
    alignItems: "center",
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  paymentSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",

 
  },
  paymentTicketInfo: {
    flex: 1,
  },
  paymentTicketName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  paymentTicketQuantity: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.7,
  },
  paymentTicketTotal: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  paymentDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 16,
  },
  paymentCostRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentCostLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    opacity: 0.8,
  },
  paymentCostValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentDiscountLabel: {
    color: "#4ade80",
  },
  paymentDiscountValue: {
    color: "#4ade80",
  },
  paymentTotalRow: {
    marginTop: 8,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  paymentTotalLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  paymentTotalValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  paymentPromoterInfo: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
  },
  paymentPromoterLabel: {
    color: "#4ade80",
    fontSize: 12,
    marginBottom: 4,
  },
  paymentPromoterCode: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "700",
  },
});

