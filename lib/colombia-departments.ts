export type DepartmentInfo = {
  department: string;
  code: string;
};

const CITY_DEPARTMENT: Record<string, DepartmentInfo> = {
  bogota: { department: "Bogotá D.C.", code: "DC" },
  medellin: { department: "Antioquia", code: "AN" },
  bello: { department: "Antioquia", code: "AN" },
  itagui: { department: "Antioquia", code: "AN" },
  envigado: { department: "Antioquia", code: "AN" },
  rionegro: { department: "Antioquia", code: "AN" },
  apartado: { department: "Antioquia", code: "AN" },
  cali: { department: "Valle del Cauca", code: "VC" },
  palmira: { department: "Valle del Cauca", code: "VC" },
  buenaventura: { department: "Valle del Cauca", code: "VC" },
  tulua: { department: "Valle del Cauca", code: "VC" },
  jamundi: { department: "Valle del Cauca", code: "VC" },
  yumbo: { department: "Valle del Cauca", code: "VC" },
  barranquilla: { department: "Atlántico", code: "AT" },
  soledad: { department: "Atlántico", code: "AT" },
  malambo: { department: "Atlántico", code: "AT" },
  cartagena: { department: "Bolívar", code: "BL" },
  magangue: { department: "Bolívar", code: "BL" },
  cucuta: { department: "Norte de Santander", code: "NS" },
  ocana: { department: "Norte de Santander", code: "NS" },
  bucaramanga: { department: "Santander", code: "ST" },
  floridablanca: { department: "Santander", code: "ST" },
  giron: { department: "Santander", code: "ST" },
  piedecuesta: { department: "Santander", code: "ST" },
  barrancabermeja: { department: "Santander", code: "ST" },
  pereira: { department: "Risaralda", code: "RI" },
  dosquebradas: { department: "Risaralda", code: "RI" },
  "santa marta": { department: "Magdalena", code: "MA" },
  cienaga: { department: "Magdalena", code: "MA" },
  ibague: { department: "Tolima", code: "TO" },
  espinal: { department: "Tolima", code: "TO" },
  pasto: { department: "Nariño", code: "NA" },
  ipiales: { department: "Nariño", code: "NA" },
  tumaco: { department: "Nariño", code: "NA" },
  manizales: { department: "Caldas", code: "CL" },
  neiva: { department: "Huila", code: "HU" },
  pitalito: { department: "Huila", code: "HU" },
  villavicencio: { department: "Meta", code: "ME" },
  armenia: { department: "Quindío", code: "QU" },
  valledupar: { department: "Cesar", code: "CE" },
  monteria: { department: "Córdoba", code: "CO" },
  sincelejo: { department: "Sucre", code: "SU" },
  popayan: { department: "Cauca", code: "CA" },
  tunja: { department: "Boyacá", code: "BY" },
  duitama: { department: "Boyacá", code: "BY" },
  sogamoso: { department: "Boyacá", code: "BY" },
  florencia: { department: "Caquetá", code: "CQ" },
  riohacha: { department: "La Guajira", code: "LG" },
  maicao: { department: "La Guajira", code: "LG" },
  quibdo: { department: "Chocó", code: "CH" },
  yopal: { department: "Casanare", code: "CS" },
  arauca: { department: "Arauca", code: "AR" },
  mocoa: { department: "Putumayo", code: "PU" },
  "san jose del guaviare": { department: "Guaviare", code: "GV" },
  leticia: { department: "Amazonas", code: "AM" },
  "puerto carreno": { department: "Vichada", code: "VI" },
  inirida: { department: "Guainía", code: "GN" },
  mitu: { department: "Vaupés", code: "VA" },
  "san andres": { department: "San Andrés", code: "SA" },
  soacha: { department: "Cundinamarca", code: "CU" },
  zipaquira: { department: "Cundinamarca", code: "CU" },
  chia: { department: "Cundinamarca", code: "CU" },
  facatativa: { department: "Cundinamarca", code: "CU" },
  mosquera: { department: "Cundinamarca", code: "CU" },
  fusagasuga: { department: "Cundinamarca", code: "CU" },
  girardot: { department: "Cundinamarca", code: "CU" },
};

export function normalizePlaceName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getCityDepartment(cityName: string): DepartmentInfo {
  const match = CITY_DEPARTMENT[normalizePlaceName(cityName)];
  if (match) return match;

  const letters = cityName
    .replace(/[^\p{L}\s]/gu, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const code =
    letters.length >= 2
      ? `${letters[0][0]}${letters[1][0]}`.toUpperCase()
      : cityName.slice(0, 2).toUpperCase();

  return { department: "Colombia", code };
}
