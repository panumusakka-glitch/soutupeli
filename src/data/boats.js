const boats = [{
  name: 'Lonka',
  hull: 5,
  headwind: 5,
  stability: 5
}, {
  name: 'Lehto',
  hull: 4,
  headwind: 4,
  stability: 5
}, {
  name: 'Ekitek',
  hull: 5,
  headwind: 4,
  stability: 3
}, {
  name: 'Parkkinen',
  hull: 3,
  headwind: 4,
  stability: 5
}, {
  name: 'Miettinen',
  hull: 3,
  headwind: 3,
  stability: 4,
  spruceOnly: true
}, {
  name: 'Liukkonen',
  hull: 3,
  headwind: 4,
  stability: 3,
  spruceOnly: true
}];
const materials = {
  "mahogany": {
    "name": "Mahonki",
    "weight": 40,
    "windMultiplier": 1.1,
    "description": "Hieman nopeampi, herkempi tuulelle."
  },
  "spruce": {
    "name": "Kuusivaneri",
    "weight": 50,
    "windMultiplier": 1,
    "description": "Vähemmän tuulen vaikutusta."
  }
};
