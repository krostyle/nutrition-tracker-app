// USDA FoodData Central solo busca en inglés. Este diccionario cubre
// alimentos genéricos comunes (sin marca) para que buscar "plátano" o
// "manzana" en español sí dispare una búsqueda útil en USDA. Nombres de
// marcas o platos preparados quedan fuera a propósito — para esos casos
// Open Food Facts ya es la fuente correcta.
const SPANISH_TO_ENGLISH: Record<string, string> = {
  agua: "water",
  leche: "milk",
  pan: "bread",
  arroz: "rice",
  huevo: "egg",
  pollo: "chicken",
  carne: "beef",
  pescado: "fish",
  atun: "tuna",
  queso: "cheese",
  yogur: "yogurt",
  yogurt: "yogurt",
  mantequilla: "butter",
  aceite: "oil",
  azucar: "sugar",
  sal: "salt",
  avena: "oats",
  miel: "honey",
  cafe: "coffee",
  te: "tea",
  jugo: "juice",
  harina: "flour",
  pasta: "pasta",
  fideos: "pasta",
  jamon: "ham",
  tocino: "bacon",
  salmon: "salmon",
  camaron: "shrimp",
  langostino: "shrimp",
  almendra: "almond",
  nuez: "walnut",
  mani: "peanut",
  cacahuate: "peanut",
  castana: "chestnut",
  chocolate: "chocolate",
  mermelada: "jam",
  quinoa: "quinoa",
  lenteja: "lentil",
  garbanzo: "chickpea",
  poroto: "bean",
  frijol: "bean",
  // frutas
  manzana: "apple",
  platano: "banana",
  banana: "banana",
  naranja: "orange",
  pera: "pear",
  uva: "grape",
  sandia: "watermelon",
  melon: "melon",
  palta: "avocado",
  aguacate: "avocado",
  frutilla: "strawberry",
  fresa: "strawberry",
  durazno: "peach",
  melocoton: "peach",
  pina: "pineapple",
  kiwi: "kiwi",
  mango: "mango",
  arandano: "blueberry",
  frambuesa: "raspberry",
  limon: "lemon",
  mandarina: "tangerine",
  ciruela: "plum",
  cereza: "cherry",
  // verduras
  tomate: "tomato",
  lechuga: "lettuce",
  zanahoria: "carrot",
  papa: "potato",
  patata: "potato",
  cebolla: "onion",
  ajo: "garlic",
  choclo: "corn",
  maiz: "corn",
  brocoli: "broccoli",
  espinaca: "spinach",
  pepino: "cucumber",
  pimenton: "bell pepper",
  pimiento: "bell pepper",
  apio: "celery",
  coliflor: "cauliflower",
  zapallo: "pumpkin",
  betarraga: "beet",
  remolacha: "beet",
  acelga: "chard",
  alcachofa: "artichoke",
  esparrago: "asparagus",
  rabano: "radish",
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizeTerm(value: string): string {
  return stripAccents(value.trim().toLowerCase());
}

// Devuelve el término en inglés para consultar USDA, o null si no hay
// traducción conocida (en ese caso no vale la pena consultar USDA).
// Solo matchea la palabra completa (o su plural simple) — no términos
// parciales mientras el usuario todavía está escribiendo.
export function toEnglishSearchTerm(query: string): string | null {
  const normalized = normalizeTerm(query);
  if (!normalized) return null;

  if (SPANISH_TO_ENGLISH[normalized]) return SPANISH_TO_ENGLISH[normalized];

  if (normalized.endsWith("es") && SPANISH_TO_ENGLISH[normalized.slice(0, -2)]) {
    return SPANISH_TO_ENGLISH[normalized.slice(0, -2)];
  }

  if (normalized.endsWith("s") && SPANISH_TO_ENGLISH[normalized.slice(0, -1)]) {
    return SPANISH_TO_ENGLISH[normalized.slice(0, -1)];
  }

  return null;
}
