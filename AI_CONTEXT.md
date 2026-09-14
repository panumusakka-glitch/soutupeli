# Sulkavan Suursoutu – AI-agentin aloituspiste

**Pysyvä ohje:**
“Älä lue koko repositorya. Lue ensin AI_CONTEXT.md. Selvitä tehtävään liittyvät tiedostot ja avaa vain ne. Tee mahdollisimman pieni paikallinen muutos. Älä refaktoroi tai muuta tehtävään liittymätöntä koodia. Käytä olemassa olevia rakenteita ennen uusien rakentamista.”

## Rakenne ja tavalliset muutokset

Kaikki pelin lähdekoodi on `dist/`-kansiossa. Se ei ole generoitu build-kansio.
Tavallinen HTML/CSS/JavaScript + Canvas; ei npm-riippuvuuksia eikä build-vaihetta.

| Muutos | Avaa ensisijaisesti |
| --- | --- |
| Soutajan arvot, sukupuoliääni, vauhtiraja, rakkoimmuniteetti | `dist/data/rowers.js` |
| Veneen arvot ja materiaalin paino/tuulikerroin | `dist/data/boats.js` |
| Eväiden määrä, annoskoko ja ravintosisältö | `dist/data/foods.js` |
| Kirosanat, henkilökohtaiset repliikit ja lähtökuulutus | `dist/data/dialogue.js` |
| Kasvokuva tai sen rajaus | `dist/data/portraits.js`, `dist/js/map/characters.js` |
| Reitti, paikannimet, tuuli- ja virtaosuudet | `dist/data/route.js`, `dist/js/map/route.js` |
| Kartan zoomaus, piirto ja nimilaput | `dist/js/map/render.js` |
| Lähtösilta ja kannustajien animaatio | `dist/js/map/bridge.js` |
| Vauhti, neste, energia, väsymys, krampit ja rakot | `dist/js/mechanics.js`, `dist/data/config.js` |
| Vedon ajoitus sekä kosketus/näppäimistö | `dist/js/input.js` |
| Valikot ja valinnan alla näkyvät ominaisuudet | `dist/js/ui/selection.js`, `dist/index.html` |
| Mittarit / eväspaneeli | `dist/js/ui/hud.js` / `dist/js/ui/provisions.js` |
| Mobiiliasettelu ja ulkoasu | `dist/styles.css`, `dist/index.html` |
| Soutuäänet ja lähtöyleisön äänet | `dist/js/audio/effects.js` |
| Puheen ajoitus, tilanteet ja automaattinen ääni | `dist/js/audio/chatter.js` |
| Tallennusmuoto, validointi ja palautus | `dist/js/storage.js` |
| Aloitus, tauko, maali ja päivityksen ohjaus | `dist/js/race.js` |

## Karttaliikenteen yläsäännöt

- Soutajat liikkuvat vain sinisellä vesialueella. Soutaja ei saa soutaa vihreällä maa-alueella eikä lossin päällä.
- Lossin ja soutajan kohdatessa jommankumman täytyy odottaa tai väistää; ne eivät saa kulkea toistensa läpi tai olla päällekkäin.
- Soutajien tavoitereitti kulkee pehmeästi ja mahdollisimman suoraan Hakovirralta Soutustadionin edustalla olevalle maalille.
- Reittivalinnoissa saa olla luontevaa variaatiota, mutta soutajat eivät saa tehdä tarpeettomia kiertoteitä tai käydä lahden pohjukoissa ilman reitin vaatimaa syytä.
- Kiertotie tehdään vain törmäyksen välttämiseksi tai todellisen kulkuesteen takia. Ahtaissa salmissa soutajat saavat kulkea tavallista tiiviimmin, jotta väistäminen ei aiheuta epärealistisia mutkia.

## Suojattu reitti

Nykyinen pääreitti, reittihaarat, turvavälit ja kapeikkojen ennakoiva
lähestyminen ovat käyttäjän visuaalisesti hyväksymiä. Älä muuta niitä
ilman käyttäjän nimenomaista pyyntöä.

## Yhteiset pelisäännöt

- `dist/js/state.js` sisältää yhteisen muuttuvan pelitilan. Alkuarvot ovat configissa; eväsvarasto muodostetaan foods-datasta. Älä kopioi dataa UI:hin.
- Tiedostot ovat pieniä tavallisia skriptejä: latausjärjestys on `dist/index.html`:ssä. `dist/js/main.js` yhdistää tapahtumat ja käynnistää pelisilmukan viimeisenä. Uusia työkaluja/moduulikehyksiä ei tarvita.
- Matka on metreinä, nopeus km/h, aika sekunteina, neste litroina, hiilihydraatit grammoina ja natrium milligrammoina.
- Tallennuksen avain `suursoutu-race-v1` ja vanhojen tallennusten yhteensopivuus säilytetään. Taukoa ei lasketa peliaikaan. Nimet toimivat tallennetuissa soutaja-/veneviittauksissa: nimeäminen vaatii migraation.
- Kartan alkuperäinen PNG on maantieteellinen pohja. `map-marker-cleanup.png`:stä käytetään vain kahden poistetun ympyrän alueita. Älä korvaa koko kartan geometriaa.
- Äänet ovat selaimen puhesynteesiä ja Web Audio -tehosteita; eivät henkilöiden oikeita ääniä. Pelin arvot/repliikit ovat fiktiivisiä.

## Tarkistus ja julkaisu

- Aja `node tests/smoke.cjs` pelilogiikan, valikon tai tallennuksen muutoksen jälkeen. Tarkistaa myös skriptien syntaksin ja latausjärjestyksen. Testit eivät korvaa oikean laitteen ääni-/kosketuskoetta.
- Paikallinen avaus: `python -m http.server 8000 --directory dist`.
- Sites-julkaisu: käytä olemassa olevaa `.openai/hosting.json`:n projektia ja Sites-ohjeita; säilytä sen nykyinen yleisö. Älä luo uutta sivustoa.
- `docs/` sisältää aiempia taustamuistioita, ei nykyistä toteutusta. Älä lue niitä tavallista muutosta varten.
