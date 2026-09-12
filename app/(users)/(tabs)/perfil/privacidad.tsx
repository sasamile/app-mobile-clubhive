import { LegalDocument } from "@/components/legal-document";
import { PRIVACY_SECTIONS } from "@/lib/legal-content";

export default function PrivacidadScreen() {
  return (
    <LegalDocument
      title="Privacidad"
      updated="Actualizado en septiembre de 2026"
      intro="Te explicamos qué datos usamos, para qué y cómo puedes ejercer tus derechos."
      sections={PRIVACY_SECTIONS}
    />
  );
}
