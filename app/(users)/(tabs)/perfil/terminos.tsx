import { LegalDocument } from "@/components/legal-document";
import { TERMS_SECTIONS } from "@/lib/legal-content";

export default function TerminosScreen() {
  return (
    <LegalDocument
      title="Términos y condiciones"
      updated="Actualizado en septiembre de 2026"
      intro="Estas condiciones regulan el uso de Tiked y la compra de entradas a través de la app."
      sections={TERMS_SECTIONS}
    />
  );
}
