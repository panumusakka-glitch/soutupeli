const personalCurses = {
  'Toni Sirviö': 'Perkele, olis pitänyt jatkaa keihäänheittoa, tämä soutu on ihan perseestä.',
  'Ari Kankkunen': 'Ei perkele tule reittiennätystä tätä tahtia!',
  'Seppo Räty': ['En perkele lähe, jos ei oo pakko', 'Saksa on paska maa', 'Perkele, keihäs olisi jo perillä.', 'Voimaa on. Huvitusta ei.'],
  'Sale Steel': ['Asiaa on harkittu. Soutamista on valitettavasti jatkettava.', 'Veneessä vallitsee yksimielisyys. Minä olen eri mieltä.', 'Airojen välinen yhteistyö vaatii vielä neuvotteluja.', 'Tässä veneessä ei näköjään oppositioon pääse.', 'Perkele. Tämän saaren kiertämisestä olisi pitänyt tehdä vaikutusarvio.', 'Tilanne on vakaa. Edistystä ei juuri tapahdu.']
};
const lines = {
  start: ['No niin. Menoksi.'],
  swear: ['Perkele!', 'Hevon vitun vittu!', 'Perseen suti!', 'Voi saatanan saatanan saatana.', 'No voi helvetin kuustoista!', 'Voi vittujen kevät!', 'Saatana, soutaako tässä vettä vai betonia?', 'Kuka perkele keksi, että rentoudutaan järvellä?', 'Kaksi airoa ja yksi helvetin huono idea.', 'Perkele, tämä järvi on kyllä väärän kokoinen.', 'Saatana, olisi pitänyt harrastaa postimerkkejä.', 'Vittu, soutu on kyllä pitkä tapa mennä samaan paikkaan.', 'Voi perkele, saarella on taas uusi mutka.', 'Saatanan Partalansaari. Eikö tästä saanut pienempää?', 'Jumalauta, tässäkö se ihmisen vapaa-aika nyt menee?', 'Perkele, airot käteen ja mielenterveys rantaan.', 'Vittu mikä kelluva työmaa.', 'Ei helvetti. Veneellä pitäisi päästä pois töistä, eikä uusiin töihin.', 'Saatana, soutulenkki. Tämä on vesistöön sijoitettu elinkautinen.', 'Perkele, järvi ei lopu vaikka miten kauhoo.'],
  bad: ['Perkele.', 'Ei vittu, ei tästä tule mitään.', 'No voi perkele. Nyt se veto hajosi.'],
  wind: ['Ei vittu, mikä tuuli.', 'Ei vittu, tämä vene ei kulje.', 'Perkele, suoraan vastaan puhaltaa.'],
  good: ['No niin, nythän tämä kulkee.', 'Nyt löytyi hyvä rytmi. Antaa mennä vaan.'],
  five: ['No niin, nyt mennään jo alle viiden tunnin vauhtia. Tässähän hätyytellään reittiennätystä.'],
  six: ['No niin, nyt mennään kuuden tunnin vauhtia. Tätä kun jatkaa, niin menee alle kuuden.'],
  seven: ['No niin, nyt ollaan alle seitsemän tunnin vauhdissa. Vielä tästä parannetaan.'],
  slow: ['Ei perkele, tätä vauhtia ei päästä edes alle seitsemän tunnin.']
};
const complaints = {
  tired: ['Vittu, voimat on niin lopussa, että varjokin soutaisi kovempaa.', 'Perkele, airo painaa kuin märkä puhelinpylväs.', 'Saatana, nyt alkaa soutaja ja vene olla eri mieltä tästä harrastuksesta.', 'Ei helvetti, mummotkin soutaisivat kohta ohi.', 'Perkele, lupasin yhden lenkin. En loppuelämää tässä veneessä.'],
  energy: ['Vittu, tankki on tyhjä. Missä ne saatanan geelit on?', 'Perkele, ei tämä vene kulje pelkällä vitutuksella. Energiaa nyt.', 'Saatana, tähän tarvittaisiin geelin sijaan pitopöytä.', 'Ei helvetti, karkit tänne ennen kuin sammun tähän penkille.'],
  stomach: ['Voi vittu, vatsassa velloo kuin toinen Saimaa.', 'Perkele, mustikkakeitto soutaa kohta takaisin.', 'Saatana, vatsa pitää kovempaa meteliä kuin airot.', 'Ei helvetti, kuka tankkasi tähän mahaan pesukoneen?'],
  blisters: ['Perkele, nyt ne rakotkin tuntuu joka vedolla.', 'Vittu, kämmenet on kuin raastinraudalla käsitelty.', 'Saatana, airoista tuli näköjään hiekkapaperia.', 'Voi perkele, rakot käsissä ja saari vielä kesken.'],
  blisterWorry: ['Perkele, joko alkaa rakko tulemaan…', 'Saatana, kunhan ei vielä kädet hajoaisi.'],
  cramps: ['Vittu, nyt kramppaa. Rauhallisemmin ja tankkaus kuntoon.', 'Perkele, lihakset vetää solmuun kuin huonosti pakattu ankkuriköysi.', 'Saatana, nyt ei revitä. Kramppi ei kiroilemalla aukea.'],
  wind: ['Ei vittu, mikä tuuli.', 'Perkele, tuuli soutaa kovempaa vastaan kuin minä eteenpäin.', 'Saatana, soutaisiko tämän järven ensin tyhjäksi, niin pääsisi kävellen?', 'Ei helvetti, vastatuuli on näköjään tämän veneen vakiovaruste.', 'Perkele, järvi sylkee naamalle ja minä maksan osallistumismaksun.'],
  slow: ['Ei saatana, tämä vene ei kule.', 'Perkele, onko ankkuri pohjassa vai pohja ankkurissa?', 'Vittu, mummokin menisi tästä ohi kahvikuppi kädessä.', 'Saatana, tämä ei ole vene. Tämä on kelluva jarru.', 'Ei helvetti, rantakivikin näyttää tekevän irtiottoa.']
};
const START_ANNOUNCEMENT = "Nämä nykyaikaiset gladiaattorit ovat lähteneet kiertämään Partalansaarta. Nähdään soutustadionilla!";
const FINISH_PRAISE = {
  first: 'Aivan huikea suoritus! Tämä oli mestarillinen soutu.',
  fast: 'Todella kova suoritus! Vauhti oli aivan mahtava.',
  solid: 'Hieno suoritus ja vahva maaliintulo.',
  finish: 'Maaliin asti taisteltu suoritus, onnittelut!'
};
