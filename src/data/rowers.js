// Fictional game ratings. Higher cramp is worse; other stats help.
const doubleCrews = [{
  rowers: ['Juho Karhu', 'El Toro'],
  bestTimeSeconds: 6 * 3600 + 20 * 60 + 54
}, {
  rowers: ['Juha Tapio', 'Anni Tapio'],
  bestTimeSeconds: 5 * 3600 + 39 * 60 + 27.8
}];
const doubleRowerNames = doubleCrews.flatMap(crew => crew.rowers);
function doublePartnerName(name) {
  return doubleCrews.find(crew => crew.rowers.includes(name))?.rowers.find(candidate => candidate !== name) || null;
}
function isDoubleCrew(first, second) {
  return doubleCrews.some(crew => crew.rowers.includes(first) && crew.rowers.includes(second) && first !== second);
}
function doubleCrewCategory(crew) {
  const genders = crew.rowers.map(name => rowers.find(candidate => candidate.name === name)?.voiceGender);
  return genders[0] === genders[1] ? genders[0] : 'mixed';
}
const rowers = [{
  "name": "Joel Naukkarinen",
  "speed": 99,
  "endurance": 98,
  "skill": 97,
  "cramp": 12,
  "hands": 96,
  "stomach": 95,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Juho Karhu",
  "speed": 88,
  "endurance": 89,
  "skill": 88,
  "cramp": 22,
  "hands": 88,
  "stomach": 88,
  "power": 88,
  "blisterImmune": false,
  "voiceGender": "male",
  "doubleOnly": true
}, {
  "name": "El Toro",
  "speed": 85,
  "endurance": 90,
  "skill": 89,
  "cramp": 20,
  "hands": 89,
  "stomach": 89,
  "power": 92,
  "blisterImmune": false,
  "voiceGender": "male",
  "doubleOnly": true
}, {
  "name": "Juha Tapio",
  "speed": 95,
  "endurance": 96,
  "skill": 95,
  "cramp": 14,
  "hands": 95,
  "stomach": 95,
  "power": 96,
  "blisterImmune": false,
  "voiceGender": "male",
  "doubleOnly": true
}, {
  "name": "Anni Tapio",
  "speed": 93,
  "endurance": 94,
  "skill": 94,
  "cramp": 16,
  "hands": 94,
  "stomach": 94,
  "power": 92,
  "blisterImmune": false,
  "voiceGender": "female",
  "doubleOnly": true
}, {
  "name": "Pertti Karppinen",
  "speed": 99,
  "endurance": 97,
  "skill": 99,
  "cramp": 8,
  "hands": 98,
  "stomach": 96,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Jari Saario",
  "speed": 82,
  "endurance": 99,
  "skill": 92,
  "cramp": 7,
  "hands": 99,
  "stomach": 97,
  "power": 94,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Kaisa Tiitinen",
  "speed": 94,
  "endurance": 97,
  "skill": 97,
  "cramp": 13,
  "hands": 97,
  "stomach": 94,
  "power": 91,
  "blisterImmune": false,
  "voiceGender": "female"
}, {
  "name": "M-L Kirvesniemi",
  "speed": 94,
  "endurance": 99,
  "skill": 93,
  "cramp": 10,
  "hands": 95,
  "stomach": 96,
  "power": 91,
  "blisterImmune": false,
  "voiceGender": "female"
}, {
  "name": "Pentti Soini",
  "speed": 92,
  "endurance": 97,
  "skill": 96,
  "cramp": 11,
  "hands": 97,
  "stomach": 96,
  "power": 93,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Heikki Karjaluoto",
  "speed": 98,
  "endurance": 99,
  "skill": 99,
  "cramp": 10,
  "hands": 99,
  "stomach": 99,
  "power": 98,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Ari Kankkunen",
  "speed": 99,
  "endurance": 99,
  "skill": 99,
  "cramp": 20,
  "hands": 99,
  "stomach": 99,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Hanna Tuominen",
  "speed": 90,
  "endurance": 96,
  "skill": 96,
  "cramp": 15,
  "hands": 92,
  "stomach": 88,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "female",
  "bestTimeMinutes": 355
}, {
  "name": "Marika Laaksonen",
  "speed": 91,
  "endurance": 94,
  "skill": 93,
  "cramp": 18,
  "hands": 90,
  "stomach": 90,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "female",
  "bestTimeMinutes": 355
}, {
  "name": "Sanna Piili",
  "speed": 90,
  "endurance": 94,
  "skill": 92,
  "cramp": 20,
  "hands": 88,
  "stomach": 89,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "female",
  "bestTimeMinutes": 355
}, {
  "name": "Panu Musakka",
  "speed": 85,
  "endurance": 72,
  "skill": 68,
  "cramp": 70,
  "hands": 70,
  "stomach": 50,
  "power": 95,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Alex Sisu",
  "speed": 91,
  "endurance": 96,
  "skill": 84,
  "cramp": 14,
  "hands": 90,
  "stomach": 94,
  "power": 88,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Jorma Suortti",
  "speed": 98,
  "endurance": 99,
  "skill": 98,
  "cramp": 12,
  "hands": 98,
  "stomach": 90,
  "power": 98,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Esa Melanen",
  "speed": 93,
  "endurance": 97,
  "skill": 96,
  "cramp": 18,
  "hands": 98,
  "stomach": 90,
  "power": 93,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Mauno Myllymäki",
  "speed": 89,
  "endurance": 98,
  "skill": 98,
  "cramp": 15,
  "hands": 99,
  "stomach": 92,
  "power": 88,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Hannu Pasanen",
  "speed": 94,
  "endurance": 95,
  "skill": 96,
  "cramp": 17,
  "hands": 96,
  "stomach": 90,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Joni Närhi",
  "speed": 93,
  "endurance": 92,
  "skill": 91,
  "cramp": 22,
  "hands": 88,
  "stomach": 85,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Einari \"Leppäsuaren Einar\" Luukkonen",
  "speed": 89,
  "endurance": 97,
  "skill": 96,
  "cramp": 15,
  "hands": 99,
  "stomach": 88,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Marko Leppämäki",
  "speed": 97,
  "endurance": 97,
  "skill": 96,
  "cramp": 18,
  "hands": 90,
  "stomach": 80,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Jari Kuhno",
  "speed": 98,
  "endurance": 99,
  "skill": 99,
  "cramp": 12,
  "hands": 98,
  "stomach": 80,
  "power": 97,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Toni Sirviö",
  "speed": 91,
  "endurance": 88,
  "skill": 86,
  "cramp": 22,
  "hands": 84,
  "stomach": 82,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Seppo Räty",
  "speed": 88,
  "endurance": 30,
  "skill": 42,
  "cramp": 35,
  "hands": 99,
  "stomach": 65,
  "power": 150,
  "racePower": 110,
  "blisterImmune": true,
  "voiceGender": "male"
}, {
  "name": "Juho Mikkonen",
  "speed": 93,
  "endurance": 93,
  "skill": 91,
  "cramp": 21,
  "hands": 90,
  "stomach": 35,
  "power": 95,
  "blisterImmune": false,
  "voiceGender": "male",
  "bestTimeMinutes": 360
}, {
  "name": "Seppo Hulkkonen",
  "speed": 93,
  "endurance": 95,
  "skill": 92,
  "cramp": 16,
  "hands": 91,
  "stomach": 94,
  "power": 96,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Hannu Liukkonen",
  "speed": 89,
  "endurance": 94,
  "skill": 96,
  "cramp": 18,
  "hands": 95,
  "stomach": 89,
  "power": 94,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Mirjami Laukkanen",
  "speed": 94,
  "endurance": 96,
  "skill": 95,
  "cramp": 14,
  "hands": 93,
  "stomach": 91,
  "power": 92,
  "blisterImmune": false,
  "voiceGender": "female"
}, {
  "name": "Puavo Immonen",
  "speed": 87,
  "endurance": 95,
  "skill": 94,
  "cramp": 24,
  "hands": 97,
  "stomach": 92,
  "power": 90,
  "blisterImmune": false,
  "voiceGender": "male"
}, {
  "name": "Sale Steel",
  "speed": 65,
  "endurance": 68,
  "skill": 75,
  "cramp": 25,
  "hands": 65,
  "stomach": 78,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male"
}];
