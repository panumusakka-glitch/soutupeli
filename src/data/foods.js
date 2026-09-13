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
  }
};
function initialInventory() {
  return Object.fromEntries(Object.entries(foods).map(([key, f]) => [key, f.stock]));
}
