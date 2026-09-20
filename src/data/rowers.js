// Fictional game ratings. Higher cramp is worse; other stats help.
const doubleCrews = [{
  rowers: ['Juho Karhu', 'El Toro'],
  bestTimeSeconds: 6 * 3600 + 20 * 60 + 54
}, {
  rowers: ['Juha Tapio', 'Anni Tapio'],
  bestTimeSeconds: 5 * 3600 + 39 * 60 + 27.8
}, {
  rowers: ['Jyrki Kiviniemi', 'Jani Söderlund'],
  bestTimeSeconds: 4 * 3600 + 42 * 60 + 50
}];
const doubleTourCrews = [
  ['Puavo Immonen', 'Pertti Korhonen'], ['Juha Soikkeli', 'Timo Forsman'],
  ['Ilkka Henttonen', 'Timo Pulli'], ['Hannu Suhonen', 'Paula Suhonen']
].map(rowers => ({rowers}));
const alternatingCrews = [{
  rowers: ['Timo Mikkonen', 'Juhani Auvinen'],
  bestTimeSeconds: 4 * 3600 + 42 * 60 + 50
}];
const alternatingTourCrews = [
  ['Timo Mikkonen', 'Mikko Innanen'], ['Hannu Pasanen', 'Kauko Simonen'],
  ['Riku Kiiskinen', 'Ville Kiiskinen'], ['Kari Kaarnaoja', 'Kari Salminen'],
  ['Sirpa Saren', 'Jarmo Vainio']
].map(rowers => ({rowers}));
const saturdayChurchCrews = [{
  name: 'Voiton Soutajat', voiceGender: 'male', speed: 98, endurance: 98, skill: 97, cramp: 11, hands: 96, stomach: 94, power: 99
}, {
  name: 'Kahvakopla', voiceGender: 'male', speed: 97, endurance: 97, skill: 98, cramp: 12, hands: 96, stomach: 95, power: 98
}, {
  name: 'Airoteam', voiceGender: 'mixed', speed: 94, endurance: 96, skill: 96, cramp: 14, hands: 94, stomach: 94, power: 95
}, {
  name: 'Mikkelin Soutajat', voiceGender: 'mixed', speed: 93, endurance: 96, skill: 97, cramp: 13, hands: 95, stomach: 95, power: 94
}, {
  name: 'SU-41', voiceGender: 'mixed', speed: 96, endurance: 97, skill: 98, cramp: 11, hands: 97, stomach: 96, power: 96
}, {
  name: 'Metso Endurance', voiceGender: 'mixed', speed: 95, endurance: 98, skill: 96, cramp: 12, hands: 96, stomach: 95, power: 96
}, {
  name: 'Nesteen Soutajat', voiceGender: 'mixed', speed: 94, endurance: 97, skill: 95, cramp: 14, hands: 95, stomach: 94, power: 95
}, {
  name: 'Kirvun Vilkas', voiceGender: 'mixed', speed: 92, endurance: 95, skill: 94, cramp: 16, hands: 93, stomach: 93, power: 94
}, {
  name: 'Saimaan Soutajat', voiceGender: 'mixed', speed: 91, endurance: 96, skill: 95, cramp: 15, hands: 94, stomach: 94, power: 92
}, {
  name: 'Suvituulitiimi Turku', voiceGender: 'mixed', speed: 90, endurance: 95, skill: 94, cramp: 17, hands: 93, stomach: 92, power: 91
}, {
  name: 'Lieksan Loiske', voiceGender: 'mixed', speed: 93, endurance: 96, skill: 95, cramp: 14, hands: 94, stomach: 94, power: 94
}, {
  name: 'Joutele', voiceGender: 'mixed', speed: 97, endurance: 98, skill: 98, cramp: 10, hands: 97, stomach: 96, power: 97
}, {
  name: 'Ikaalisten Soutajat', voiceGender: 'mixed', speed: 94, endurance: 97, skill: 96, cramp: 13, hands: 95, stomach: 95, power: 95
}, {
  name: 'Kaukaan Lylyn Soutajat', voiceGender: 'mixed', speed: 95, endurance: 96, skill: 97, cramp: 12, hands: 96, stomach: 94, power: 96
}, {
  name: 'Rauta-Kourat', voiceGender: 'mixed', speed: 92, endurance: 96, skill: 94, cramp: 15, hands: 98, stomach: 93, power: 96
}, {
  name: 'Iitin Soutajat', voiceGender: 'mixed', speed: 96, endurance: 97, skill: 97, cramp: 11, hands: 96, stomach: 95, power: 96
}, {
  name: 'Vihtavuoren Pamaus', voiceGender: 'mixed', speed: 94, endurance: 96, skill: 95, cramp: 14, hands: 95, stomach: 94, power: 95
}].map(crew => ({...crew, blisterImmune: false, churchOnly: true}));
const nightChurchCrewNames = [
  'Villen Vintiöt', 'Hämeenlinnan Latu', 'Keravan Urheilijat', 'Anjalan Liitto',
  'Iitin Soutajat', 'Hullun Hirven Soutajat', 'Kivennavan Soutajat', 'Kinkun Kiertäjät',
  'Marskin Airot', 'Pääkaupunkiseudun Taksit', 'Joutsan Soututeam', 'Imatran Sellu',
  'Metsähallitus', 'Tuohikotin Rannanpojat', 'Nesteen Soutajat Porvoo', 'Helsingin Energia',
  'Äetsän Kunto -81', 'UPM-Kymmene / UPM-Metsä Savonlinna', 'Voiton Soutajat',
  'Metso Paper Suvituuli'
];
const nightChurchCrews = nightChurchCrewNames.map((name, index) =>
  saturdayChurchCrews.find(crew => crew.name === name) || {
    name, voiceGender: 'mixed', speed: 89 + index % 8, endurance: 92 + index % 7,
    skill: 90 + (index * 3) % 9, cramp: 11 + (index * 2) % 9,
    hands: 91 + (index * 5) % 8, stomach: 91 + (index * 4) % 7,
    power: 90 + (index * 2) % 9, blisterImmune: false, churchOnly: true
  }
);
const tourChurchCrewNames = [
  'Atominmurskaajat', 'Luumäen Kirkkosoutujoukkue', 'AKT:läiset Vesillä',
  'Actiw Vikings', 'Soutu Team Koiso', 'Lentovene', 'Puulaaki',
  'Lännentien Soutajat', 'Soutavat Automiehet', 'TARAKI'
];
const tourChurchCrews = tourChurchCrewNames.map((name, index) => ({
  name, voiceGender: 'mixed', speed: 84 + index % 8, endurance: 89 + index % 9,
  skill: 86 + (index * 3) % 10, cramp: 14 + (index * 2) % 10,
  hands: 88 + (index * 5) % 10, stomach: 88 + (index * 4) % 9,
  power: 86 + (index * 2) % 10, blisterImmune: false, churchOnly: true
}));
const churchCrews = [...new Map([...saturdayChurchCrews, ...nightChurchCrews, ...tourChurchCrews].map(crew => [crew.name, crew])).values()];
function churchCrewsForStart(start = churchStart) {
  return start === 'night' ? nightChurchCrews : start === 'thursday' ? tourChurchCrews : saturdayChurchCrews;
}
const crewSeries = [...doubleCrews, ...doubleTourCrews, ...alternatingCrews, ...alternatingTourCrews];
const doubleRowerNames = crewSeries.flatMap(crew => crew.rowers);
function doublePartnerName(name, type = raceType) {
  const crews = ['double', 'alternating'].includes(type) ? crewsForRaceType(type) : crewSeries;
  return crews.find(crew => crew.rowers.includes(name))?.rowers.find(candidate => candidate !== name) || null;
}
function isDoubleCrew(first, second) {
  return crewSeries.some(crew => crew.rowers.includes(first) && crew.rowers.includes(second) && first !== second);
}
function crewsForRaceType(type, start = type === 'alternating' ? alternatingStart : doubleStart) {
  if (type === 'alternating') return start === 'thursday' ? alternatingTourCrews : alternatingCrews;
  return (start === 'thursday' ? doubleTourCrews : doubleCrews);
}
function isCrewForRaceType(first, second, type, start) {
  return crewsForRaceType(type, start).some(crew => crew.rowers.includes(first) && crew.rowers.includes(second) && first !== second);
}
function doubleCrewCategory(crew) {
  const genders = crew.rowers.map(name => rowers.find(candidate => candidate.name === name)?.voiceGender);
  return genders[0] === genders[1] ? genders[0] : 'mixed';
}
const canoeRowers = [
  {name: 'Tero Tiitu', speed: 91, endurance: 96, skill: 95, cramp: 14, hands: 95, stomach: 94, power: 92, blisterImmune: false, voiceGender: 'male', canoeOnly: true, singleTourOnly: true},
  {name: 'Juho Moilanen', speed: 90, endurance: 97, skill: 94, cramp: 15, hands: 96, stomach: 95, power: 91, blisterImmune: false, voiceGender: 'male', canoeOnly: true, singleTourOnly: true}
];
const rowers = [...churchCrews, ...canoeRowers, ...[
  ['Mikko Innanen', 91], ['Kauko Simonen', 89], ['Riku Kiiskinen', 92], ['Ville Kiiskinen', 91],
  ['Kari Kaarnaoja', 90], ['Kari Salminen', 89], ['Sirpa Saren', 90], ['Jarmo Vainio', 91]
].map(([name, base], index) => ({name, speed: base, endurance: 94 + index % 5, skill: 92 + index % 7,
  cramp: 13 + index % 7, hands: 93 + index % 6, stomach: 92 + index % 6,
  power: 91 + index % 7, blisterImmune: false, voiceGender: name === 'Sirpa Saren' ? 'female' : 'male', doubleOnly: true, alternatingTourOnly: true})), ...[
  ['Paavo Immonen', 89, 'male'], ['Pertti Korhonen', 90, 'male'], ['Juha Soikkeli', 91, 'male'], ['Timo Forsman', 90, 'male'],
  ['Ilkka Henttonen', 92, 'male'], ['Timo Pulli', 91, 'male'], ['Hannu Suhonen', 89, 'male'], ['Paula Suhonen', 90, 'female']
].map(([name, base, voiceGender], index) => ({name, speed: base, endurance: 93 + index % 6, skill: 91 + index % 7,
  cramp: 14 + index % 7, hands: 92 + index % 7, stomach: 92 + index % 6, power: 90 + index % 7,
  blisterImmune: false, voiceGender, doubleOnly: true, doubleTourOnly: true})), {
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
  "name": "Tuomo Korkolainen", "speed": 91, "endurance": 96, "skill": 95,
  "cramp": 15, "hands": 95, "stomach": 94, "power": 92,
  "blisterImmune": false, "voiceGender": "male", "singleTourOnly": true
}, {
  "name": "Risto Jussila", "speed": 89, "endurance": 97, "skill": 94,
  "cramp": 14, "hands": 96, "stomach": 95, "power": 90,
  "blisterImmune": false, "voiceGender": "male", "singleTourOnly": true
}, {
  "name": "Ari Luoto", "speed": 92, "endurance": 95, "skill": 96,
  "cramp": 13, "hands": 94, "stomach": 93, "power": 93,
  "blisterImmune": false, "voiceGender": "male", "singleTourOnly": true
}, {
  "name": "Juha Hanni", "speed": 90, "endurance": 96, "skill": 93,
  "cramp": 16, "hands": 95, "stomach": 94, "power": 91,
  "blisterImmune": false, "voiceGender": "male", "singleTourOnly": true
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
  "name": "Jyrki Kiviniemi",
  "speed": 99,
  "endurance": 98,
  "skill": 99,
  "cramp": 9,
  "hands": 98,
  "stomach": 96,
  "power": 97,
  "blisterImmune": false,
  "voiceGender": "male",
  "doubleOnly": true
}, {
  "name": "Jani Söderlund",
  "speed": 98,
  "endurance": 99,
  "skill": 99,
  "cramp": 8,
  "hands": 99,
  "stomach": 97,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male",
  "doubleOnly": true
}, {
  "name": "Timo Mikkonen",
  "speed": 99,
  "endurance": 98,
  "skill": 99,
  "cramp": 9,
  "hands": 98,
  "stomach": 96,
  "power": 97,
  "blisterImmune": false,
  "voiceGender": "male",
  "doubleOnly": true
}, {
  "name": "Juhani Auvinen",
  "speed": 98,
  "endurance": 99,
  "skill": 99,
  "cramp": 8,
  "hands": 99,
  "stomach": 97,
  "power": 99,
  "blisterImmune": false,
  "voiceGender": "male",
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
  "name": "Ilmo Liukko",
  "speed": 73,
  "endurance": 95,
  "skill": 77,
  "cramp": 20,
  "hands": 90,
  "stomach": 95,
  "power": 74,
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
  "voiceGender": "male",
  "hidden": true
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
  "voiceGender": "male",
  "hidden": true
}];
