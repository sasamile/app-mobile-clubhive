export type LegalSection = {
  title: string;
  body: string;
};

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Qué es Tiked",
    body: "Tiked es una plataforma digital para descubrir eventos y comprar entradas. Al crear una cuenta o completar una compra, aceptas estos términos. Si no estás de acuerdo, no uses la app.",
  },
  {
    title: "2. Cuenta",
    body: "Eres responsable de la información que registras y de mantener el acceso a tu cuenta. El uso de Tiked es personal. No compartas tu sesión ni intentes acceder a cuentas de otras personas. Podemos suspender una cuenta si detectamos fraude, abuso o incumplimiento de estas reglas.",
  },
  {
    title: "3. Compra de entradas",
    body: "Las entradas se venden en nombre del organizador del evento. El precio, el cupo y las condiciones de cada boleta se muestran antes de pagar. Al confirmar el pago, se genera una transacción con nuestro procesador de pagos. La entrada queda asociada a tu cuenta y se muestra en la pestaña Entradas.",
  },
  {
    title: "4. Uso de la entrada",
    body: "La entrada es un título de acceso al evento. Debes presentarla (código QR o el medio indicado) en la puerta. El organizador puede pedir un documento de identidad. No está permitido revender entradas por fuera de los canales autorizados, alterar el QR ni ceder el acceso de forma que induzca a error.",
  },
  {
    title: "5. Cambios, cancelaciones y reembolsos",
    body: "Si el organizador cancela, reprograma o modifica de forma sustancial el evento, las reglas de reembolso o cambio las define el organizador y la ley aplicable. Tiked puede ayudar a gestionar la devolución cuando el pago se hizo en la app, pero no garantiza reembolsos por arrepentimiento, llegada tarde o denegación de ingreso por incumplimiento de las normas del venue.",
  },
  {
    title: "6. Conducta",
    body: "No uses la app para actividades ilícitas, spam, ingeniería inversa no autorizada ni para interferir con otros usuarios u organizadores. Nos reservamos el derecho de retirar contenido o restringir el acceso si hay un riesgo razonable para la plataforma o para terceros.",
  },
  {
    title: "7. Limitación",
    body: "Tiked opera como intermediario tecnológico. El evento, la producción, la seguridad en el recinto y el cumplimiento de aforos son responsabilidad del organizador y del venue. En la medida permitida por la ley colombiana, Tiked no responde por daños indirectos derivados de fallas del evento o de terceros (pagos, redes, recintos).",
  },
  {
    title: "8. Contacto",
    body: "Si tienes una duda sobre tu compra o estos términos, escríbenos desde la app o a través de los canales publicados en tiked.co. Estos términos pueden actualizarse; el uso continuado de la app después de un cambio implica que los aceptas.",
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Responsable",
    body: "Tiked trata datos personales para operar la app de compra de entradas. El tratamiento se rige por la Ley 1581 de 2012 y demás normas colombianas de protección de datos.",
  },
  {
    title: "2. Datos que usamos",
    body: "Podemos tratar nombre, correo, foto de perfil (si inicias sesión con Google o Apple), ciudad, historial de compras, identificadores de dispositivo y datos técnicos de uso. El procesador de pagos recibe la información necesaria para cobrar; Tiked no almacena el número completo de tu tarjeta.",
  },
  {
    title: "3. Para qué los usamos",
    body: "Prestarte el servicio (cuenta, entradas, QR), mostrarte eventos según tu ciudad, procesar pagos, prevenir fraude, enviarte avisos operativos de tu compra y mejorar el producto. No vendemos tu información a terceros para su mercadeo independiente.",
  },
  {
    title: "4. Con quién los compartimos",
    body: "Organizadores (lo necesario para validar tu ingreso), pasarelas de pago, proveedores de infraestructura y autoridades cuando la ley lo exija. Los proveedores solo deben usar los datos para prestar su servicio a Tiked.",
  },
  {
    title: "5. Conservación y seguridad",
    body: "Conservamos los datos mientras tu cuenta esté activa y el tiempo adicional que exijan obligaciones contables, de fraude o de reclamaciones. Aplicamos medidas razonables de seguridad; ningún sistema es 100 % invulnerable.",
  },
  {
    title: "6. Tus derechos",
    body: "Puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos, y revocar la autorización, en los términos de la ley. Para ejercerlos, contáctanos por los canales de tiked.co. Cerrar sesión no borra por sí solo el historial de compras que debamos conservar.",
  },
  {
    title: "7. Menores",
    body: "La app está pensada para mayores de edad. Si un menor usa Tiked, el adulto responsable debe supervisar la cuenta y la compra.",
  },
];
