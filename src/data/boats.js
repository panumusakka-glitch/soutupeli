const boats = [{
  name: 'Lonka',
  material: 'mahogany',
  hull: 5,
  headwind: 5,
  stability: 5
}, {
  name: 'Lehto',
  material: 'mahogany',
  hull: 4,
  headwind: 4,
  stability: 5
}, {
  name: 'Ekitek',
  material: 'mahogany',
  hull: 5,
  headwind: 4,
  stability: 3
}, {
  name: 'Parkkinen',
  material: 'mahogany',
  hull: 3,
  headwind: 4,
  stability: 5
}, {
  name: 'Miettinen',
  material: 'spruce',
  hull: 3,
  headwind: 3,
  stability: 4,
  spruceOnly: true
}, {
  name: 'Liukkonen',
  material: 'spruce',
  hull: 3,
  headwind: 4,
  stability: 3,
  spruceOnly: true
}, {
  name: 'Kirkkovene',
  material: 'spruce',
  hull: 5,
  headwind: 5,
  stability: 5,
  weight: 650,
  spruceOnly: true,
  churchOnly: true
}, {
  name: 'Retkikanootti', label: 'Kajakki', material: 'spruce', hull: 4, headwind: 3, stability: 3,
  weight: 18, canoeOnly: true
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
