const personalCurses = {
  'Toni Sirviö': 'Perkele, olis pitänyt jatkaa keihäänheittoa, tämä soutu on ihan perseestä.',
  'Ari Kankkunen': 'Ei perkele tule reittiennätystä tätä tahtia!',
  'Seppo Räty': ['En perkele lähe, jos ei oo pakko', 'Saksa on paska maa', 'Perkele, keihäs olisi jo perillä.', 'Ei huvita.'],
  'Sale Steel': ['Asiaa on harkittu. Soutamista on valitettavasti jatkettava.', 'Veneessä vallitsee yksimielisyys. Minä olen eri mieltä.', 'Airojen välinen yhteistyö vaatii vielä neuvotteluja.', 'Tässä veneessä ei näköjään oppositioon pääse.', 'Perkele. Tämän saaren kiertämisestä olisi pitänyt tehdä vaikutusarvio.', 'Tilanne on vakaa. Edistystä ei juuri tapahdu.']
};
const lines = {
  start: ['No niin. Menoksi.'],
  swear: ['Perkele!', 'Hevon vitun vittu!', 'Perseen suti!', 'Voi saatanan saatanan saatana.', 'No voi helvetin kuustoista!', 'Voi vittujen kevät!', 'Saatana, soutaako tässä vettä vai betonia?', 'Miksi tänne piti taas lähteä', 'Perkele, 60 kilometriä on kyllä pitkä matka.', 'Olis pitänyt keksiä joku muu harrastus, vaikka postimerkkeily.', 'Jumalauta, kuka valitsee vapaa-ajallaan lähteä soutamaan 60 kilometriä??', 'On tämä saatana työmaa.', 'Perkele, järvi ei lopu vaikka miten kauhoo.'],
  bad: ['Perkele.', 'Ei vittu, ei tästä tule mitään.'],
  wind: ['Ei vittu, mikä tuuli.', 'Ei vittu, tämä vene ei kulje.', 'Perkele, suoraan vastaan puhaltaa.'],
  good: ['No niin, nythän tämä kulkee.', 'Nyt löytyi hyvä rytmi. Antaa mennä vaan.'],
  five: ['No niin, nyt mennään jo alle viiden tunnin vauhtia. Tässähän hätyytellään reittiennätystä.'],
  six: ['No niin, nyt mennään kuuden tunnin vauhtia. Tätä kun jatkaa, niin menee alle kuuden.'],
  seven: ['No niin, nyt ollaan alle seitsemän tunnin vauhdissa. Vielä tästä parannetaan.'],
  slow: ['Ei perkele, tätä vauhtia ei päästä edes alle seitsemän tunnin.'],
  smoke: ['Laitetaanhan nortti huuleen.', 'Se olis taas körssitauon paikka.']
};
const complaints = {
  fueling: ['Ei saatana, taaskaan tankkaus onnistunut.'],
  tired: ['Vittu, voimat on ihan lopussa', 'Perkele, airo painaa kuin märkä puhelinpylväs.', 'Saatana, nyt alkaa soutaja ja vene olla eri mieltä tästä harrastuksesta.', 'Ei helvetti, mummotkin soutaa kohta ohi.'],
  energy: ['Vittu, tankki on tyhjä. Missä ne saatanan geelit on?', 'Perkele, ei tämä vene kulje pelkällä vitutuksella. Energiaa nyt.', 'Saatana, tähän tarvittaisiin geelin sijaan pitopöytä.', 'Ei helvetti, karkit tänne ennen kuin sammun tähän penkille.'],
  stomach: ['Voi vittu, vatsassa velloo', 'Perkele, mustikkakeitto soutaa kohta vastaan.', 'Saatana, vatsa pitää kovempaa meteliä kuin nämä ruosteiset hankaimet.', 'Ei helvetti, kuka käski tankata makkaraperunoita?'],
  stomachEarly: ['Ei hitto, nyt ei kyllä imeydy.', 'Ei saakeli, eikö tuo maha toimi?'],
  stomachSevere: ['Ei saatana, pääseeköhän täältä ikinä pois?', 'Ei vittu, miksi tänne piti taas lähteä?'],
  blisters: ['Ei vittu, rakotkin jo käsissä', 'Vittu, kämmenet on kuin raastinraudalla käsitelty.', 'Saatana, airoista tuli näköjään hiekkapaperia.', 'Voi perkele, rakot käsissä ja vitusti matkaa jäljellä'],
  blisterWorry: ['Perkele, joko alkaa rakko tulemaan…', 'Saatana, kunhan ei vielä tässä vaiheessa kädet menisi verille.'],
  cramps: ['Vittu, nyt kramppaa', 'Perkele, vatsalihaksetkin kramppaa', 'Ei vittu, millä näistä krampeista pääsee'],
  wind: ['Ei vittu, mikä tuuli.', 'Perkele, tämä vene ei kulje minnekään', 'Kävellenkin pääsis nopeammin', 'Vittu, onko täällä aina pakko olla tällainen vastatuuli.', 'Ja minä vielä maksan tästä osallistumismaksun.'],
  slow: ['Ei saatana, tämä vene ei kule.', 'Perkele, onko ankkuri pohjassa?', 'Vittu, mummokin menisi tästä ohi kahvikuppi kädessä.', 'Saatana, tämä ei ole vene. Tämä on kelluva jarru.', 'Ei helvetti, rantakivikin näyttää tekevän irtiottoa.']
};
const START_ANNOUNCEMENT = "Nämä nykyaikaiset gladiaattorit ovat lähteneet kiertämään Partalansaarta. Nähdään soutustadionilla!";
const FINISH_PRAISE = {
  first: 'Aivan huikea suoritus! Tämä oli mestarillinen soutu.',
  fast: 'Todella kova suoritus! Vauhti oli aivan mahtava.',
  solid: 'Hieno suoritus ja vahva maaliintulo.',
  finish: 'Maaliin asti taisteltu suoritus, onnittelut!'
};
