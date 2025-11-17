import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";

// Configuración de Wompi (usar variables de entorno en producción)
export const WOMPI_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_WOMPI_PUBLIC_KEY ||
  "pub_test_On68MfT7IRF1tfK0LY0MQnqw0nDOmlI6";
export const WOMPI_PRIVATE_KEY =
  process.env.EXPO_PUBLIC_WOMPI_PRIVATE_KEY ||
  "prv_test_4dMgQFmrifeob8XfJJLXGo5Ci5ZEdDvN";
export const WOMPI_INTEGRITY_SECRET =
  process.env.EXPO_PUBLIC_WOMPI_INTEGRITY_SECRET ||
  "test_integrity_o3dz0ioKh6KDoot2B9s4oicGJ2CmGUlO";

export const WOMPI_API_URL = "https://sandbox.wompi.co/v1";

/**
 * Genera una referencia única para la transacción
 */
export function generateReference(): string {
  return `ref-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Genera la firma de integridad para Wompi
 */
export async function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  expirationTime?: string
): Promise<string> {
  if (!WOMPI_INTEGRITY_SECRET) {
    throw new Error("WOMPI_INTEGRITY_SECRET no está configurado");
  }

  let dataToSign = `${reference}${amountInCents}COP${WOMPI_INTEGRITY_SECRET}`;
  if (expirationTime) {
    dataToSign = `${reference}${amountInCents}COP${expirationTime}${WOMPI_INTEGRITY_SECRET}`;
  }

  // Usar expo-crypto para generar el hash SHA-256
  const hash = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    dataToSign
  );

  return hash;
}

/**
 * Crea la URL de pago de Wompi
 */
export async function createWompiPaymentUrl(
  amount: number,
  reference: string,
  customerEmail: string,
  redirectUrl: string,
  customerData?: { fullName?: string; phoneNumber?: string },
  expirationTime?: string
): Promise<{ paymentUrl: string; transactionId?: string }> {
  const amountInCents = Math.round(amount * 100);
  const integritySignature = await generateIntegritySignature(
    reference,
    amountInCents,
    expirationTime
  );

  const params = new URLSearchParams({
    "public-key": WOMPI_PUBLIC_KEY,
    currency: "COP",
    "amount-in-cents": String(amountInCents),
    reference,
    "redirect-url": redirectUrl,
    "signature:integrity": integritySignature,
  });

  if (customerEmail) params.append("customer-data:email", customerEmail);
  if (customerData?.fullName)
    params.append("customer-data:full-name", customerData.fullName);
  if (customerData?.phoneNumber) {
    params.append("customer-data:phone-number", customerData.phoneNumber);
    params.append("customer-data:phone-number-prefix", "+57");
  }

  const checkoutUrl = "https://checkout.wompi.co/p/";
  const paymentUrl = `${checkoutUrl}?${params.toString()}`;

  return {
    paymentUrl,
  };
}

/**
 * Verifica el estado de una transacción por su ID
 */
export async function checkTransactionStatus(transactionId: string) {
  const response = await fetch(`${WOMPI_API_URL}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}` },
  });

  if (!response.ok) {
    throw new Error("Error verificando transacción");
  }

  return response.json();
}

/**
 * Busca una transacción por su referencia en Wompi
 * Retorna el transactionId y el estado de la transacción
 */
export async function findTransactionByReference(reference: string) {
  try {
    // Wompi permite buscar transacciones usando query parameters
    // Intentamos buscar la transacción más reciente con esta referencia
    const response = await fetch(
      `${WOMPI_API_URL}/transactions?reference=${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Error buscando transacción: ${response.status}`);
    }

    const data = await response.json();
    
    // La respuesta puede ser un objeto con un array de transacciones o una transacción única
    if (data.data) {
      // Si es un array, tomar la primera (más reciente)
      if (Array.isArray(data.data)) {
        const transaction = data.data.find((t: any) => t.reference === reference);
        if (transaction) {
          return {
            transactionId: transaction.id,
            status: transaction.status,
            data: transaction,
          };
        }
      } else if (data.data.id) {
        // Si es un objeto único
        return {
          transactionId: data.data.id,
          status: data.data.status,
          data: data.data,
        };
      }
    }

    // Si no encontramos la transacción
    return null;
  } catch (error) {
    console.error("Error buscando transacción por referencia:", error);
    throw error;
  }
}

