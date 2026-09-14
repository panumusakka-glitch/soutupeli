// One serving per click. Fluid in litres, carbs and sodium in grams / milligrams.
const foods = {
  "gel": {
    "name": "Energiageeli",
    "carbs": 25,
    "fluid": 0,
    "sodium": 50,
    "stress": 2,
    "stock": 10,
    "unit": "piece"
  },
  "pickle": {
    "name": "Suolakurkku",
    "carbs": 1,
    "fluid": 0.03,
    "sodium": 250,
    "stress": 0,
    "stock": 15,
    "unit": "piece"
  },
  "juice": {
    "name": "Mustikkakeitto",
    "carbs": 10,
    "fluid": 0.1,
    "sodium": 5,
    "stress": 0,
    "stock": 15,
    "unit": "drink"
  },
  "saltwater": {
    "name": "Suolavesi",
    "carbs": 0,
    "fluid": 0.05,
    "sodium": 80,
    "stress": 0,
    "stock": 10,
    "unit": "drink"
  },
  "sportsdrink": {
    "name": "Urheilujuoma",
    "carbs": 12,
    "fluid": 0.2,
    "sodium": 120,
    "stress": 1,
    "stock": 30,
    "unit": "drink"
  },
  "candy": {
    "name": "Energiakarkki",
    "carbs": 5,
    "fluid": 0,
    "sodium": 0,
    "stress": 0,
    "stock": 15,
    "unit": "piece"
  },
  "water": {
    "name": "Vesi",
    "carbs": 0,
    "fluid": 0.25,
    "sodium": 0,
    "stress": 0,
    "stock": 8,
    "unit": "drink"
  },
  "beer": {
    "name": "Karhu-olut",
    "carbs": 10,
    "fluid": 0.33,
    "sodium": 10,
    "stress": 12,
    "alcohol": 1,
    "stock": 12,
    "unit": "drink"
  },
  "cigarette": {
    "name": "North State -tupakka",
    "carbs": 0,
    "fluid": 0,
    "sodium": 0,
    "stress": 10,
    "nicotine": 1,
    "stock": 20,
    "unit": "piece"
  },
  "sausage": {
    "name": "HK Sininen lenkki",
    "carbs": 12,
    "fluid": 0,
    "sodium": 900,
    "stress": 18,
    "stock": 4,
    "unit": "piece"
  },
  "chips": {
    "name": "Sipsipussi",
    "carbs": 28,
    "fluid": 0,
    "sodium": 320,
    "stress": 12,
    "digestion": 14,
    "stackingStress": true,
    "stock": 6,
    "unit": "piece"
  },
  "donut": {
    "name": "Donitsi",
    "carbs": 30,
    "fluid": 0,
    "sodium": 180,
    "stress": 10,
    "digestion": 12,
    "stackingStress": true,
    "stock": 8,
    "unit": "piece"
  },
  "cola": {
    "name": "Coca-Cola",
    "carbs": 35,
    "fluid": 0.33,
    "sodium": 15,
    "stress": 6,
    "fastCarbs": 20,
    "stackingStress": true,
    "stock": 12,
    "unit": "drink"
  }
};

const provisionPacks = {
  athlete: {
    name: "Urheilijan paketti",
    description: "Energiageeliä, elektrolyyttejä, urheilujuomaa ja vettä.",
    inventory: {gel: 10, pickle: 8, saltwater: 6, sportsdrink: 20, water: 4}
  },
  fun: {
    name: "Hupisoutajan paketti",
    description: "Karhu-olutta, North State -tupakkaa ja HK Sinistä lenkkiä.",
    inventory: {beer: 12, cigarette: 20, sausage: 4}
  },
  gourmet: {
    name: "Herkkusuun paketti",
    description: "Energiakarkkia, sipsejä, donitseja ja Coca-Colaa.",
    inventory: {candy: 20, chips: 6, donut: 8, cola: 12}
  },
  legacy: {
    name: "Perinteinen eväsvalikoima",
    description: "Aiemmasta tallennuksesta palautettu eväsvalikoima.",
    inventory: {gel: 10, pickle: 15, juice: 15, saltwater: 10, sportsdrink: 30, candy: 15, water: 8}
  }
};

function initialInventory(pack = 'legacy') {
  const contents = provisionPacks[pack]?.inventory || {};
  return Object.fromEntries(Object.keys(foods).map(key => [key, contents[key] || 0]));
}
