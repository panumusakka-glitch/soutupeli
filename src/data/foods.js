// One serving per click. Fluid in litres, carbs and sodium in grams / milligrams.
const foods = {
  "gel": {
    "name": "Dexal",
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
    "name": "Hart Sport",
    "carbs": 12,
    "fluid": 0.2,
    "sodium": 120,
    "stress": 1,
    "stock": 30,
    "unit": "drink"
  },
  "candy": {
    "name": "Fazer-hedelm\u00e4makeinen",
    "carbs": 5,
    "fluid": 0,
    "sodium": 0,
    "stress": 0,
    "mass": 5,
    "duration": 2,
    "rowingFactor": 0.95,
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
    "name": "HK Sininen -pala",
    "carbs": 3,
    "fluid": 0,
    "sodium": 225,
    "stress": 5,
    "digestion": 12,
    "mass": 145,
    "duration": 12,
    "rowingFactor": 0.5,
    "stock": 8,
    "unit": "piece"
  },
  "chips": {
    "name": "Taffel-sipsikourallinen",
    "carbs": 8,
    "fluid": 0,
    "sodium": 90,
    "stress": 3,
    "digestion": 3,
    "mass": 17,
    "duration": 10,
    "rowingFactor": 0.8,
    "stackingStress": true,
    "stock": 6,
    "unit": "piece"
  },
  "donut": {
    "name": "Arnold's-donitsi",
    "carbs": 30,
    "fluid": 0,
    "sodium": 180,
    "stress": 10,
    "digestion": 12,
    "mass": 80,
    "duration": 10,
    "rowingFactor": 0.7,
    "stackingStress": true,
    "stock": 8,
    "unit": "piece"
  },
  "cola": {
    "name": "Sokerillinen Coca-Cola",
    "carbs": 10.6,
    "fluid": 0.1,
    "sodium": 5,
    "stress": 2,
    "fastCarbs": 6,
    "duration": 5,
    "rowingFactor": 0.9,
    "servingUnits": 2,
    "inventoryUnit": "dl",
    "stackingStress": true,
    "stock": 12,
    "unit": "drink"
  }
};

const provisionPacks = {
  athlete: {
    name: "Urheilijan paketti",
    description: "Noin 75 g hiilihydraattia tunnissa kahdeksan tunnin suoritukseen.",
    inventory: {gel: 14, pickle: 8, saltwater: 6, sportsdrink: 20, water: 4}
  },
  fun: {
    name: "Hupisoutajan paketti",
    description: "Karhu-olutta, North State -tupakkaa ja HK Sinistä lenkkiä.",
    inventory: {beer: 12, cigarette: 20, sausage: 8},
    description: "Karhu-olutta, North State -tupakkaa ja kaksi 580 g HK Sinist\u00e4 lenkki\u00e4."
  },
  gourmet: {
    name: "Herkuttelijan paketti",
    description: "Energiakarkkia, sipsejä, donitseja ja Coca-Colaa.",
    inventory: {candy: 40, chips: 24, donut: 6, cola: 15},
    description: "Kaksi 200 g Taffel-sipsipussia, kuusi Arnold's-donitsia, 200 g Fazer-hedelm\u00e4makeisia ja 1,5 l Coca-Colaa."
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
