# Sulkavan Suursoutu: parisoutusarjan suunnitelma

Parisoutu lisätään yksinsoudun rinnalle omaksi kilpailusarjakseen. Nykyinen
yksinsoutu, sen kilpailijat, ennätykset ja vanhat tallennukset säilyvät
sellaisinaan. Ensimmäisen version tavoite on, että kahden soutajan valinta,
erillinen kilpailu ja miehistön yhteistyö tuntuvat pelissä aidosti erilaisilta
kuin yksinsoutu ilman toista samanaikaista ohjainta.

## Pelaajan kulku

Uuden soudun alussa valitaan ensin sarja: **Yksinsoutu** tai **Parisoutu**.
Parisoudussa valintavaiheet ovat:

1. valitse ensimmäinen soutaja;
2. valitse toinen, eri soutaja;
3. valitse parisoutuvene;
4. valitse yhteinen eväspaketti;
5. tarkista miehistö ja lähde Hakovirralta.

Miesten, naisten ja sekaparien sarja määräytyy valitun miehistön perusteella.
Valikkoteksteissä ja tuloksissa käytetään miehistön molempia nimiä. Tallennuspaikka
kertoo sarjan, nimet, matkan ja ajan, jotta yksin- ja parisoudut erottaa heti.

## Ohjaus ja yhteistyö

Nykyinen paina–vedä–vapauta-ohjaus säilyy. Pelaaja määrää tahtisoutajan vedon;
toinen soutaja seuraa sitä omien taito-, väsymys- ja kuntotekijöidensä rajoissa.
Uusi **synkronointi**-arvo kuvaa, kuinka hyvin vedot osuvat yhteen.

- Tasainen tahti ja onnistuneet vedot nostavat synkronointia.
- Äkilliset tahdin tai voiman muutokset, liian korkea vetotahti sekä väsyneen
  parin pakottaminen laskevat sitä.
- Hyvä synkronointi välittää molempien voiman veneeseen tehokkaasti.
- Huono synkronointi hukkaa tehoa, heikentää vakautta ja kasvattaa hetkellisesti
  rasitusta, mutta ei pysäytä venettä kokonaan.

Pelaaja valitsee ennen lähtöä tahtisoutajan. Roolin voi vaihtaa kilpailussa vain
taukovalikon kautta, jotta ohjaus pysyy selkeänä. Parin puhe reagoi onnistuneisiin
vetoihin, rytmin hajoamiseen, tankkaukseen ja toisen soutajan vaikeuksiin.

## Fysiologia, eväät ja suorituskyky

Molemmilla soutajilla on omat arvonsa: energia, nestetasapaino, tuoreus, W′,
rakot ja krampit. Veneen eteneminen lasketaan molempien sillä hetkellä veneeseen
välittyvästä tehosta ja synkronoinnista; pelkkä ominaisuuksien keskiarvo ei riitä.
Heikomman soutajan tilanne alkaa siten luonnollisesti rajoittaa miehistöä.

HUD näyttää oletuksena miehistön kriittisemmän arvon ja avattavassa näkymässä
molempien mittarit. Eväät ovat yhteisessä venevarastossa, mutta pelaaja valitsee,
kumpi soutaja nauttii annoksen. Nauttiminen heikentää kyseisen soutajan panosta
hetkellisesti; pari jatkaa soutamista. Eväspakettien määrät mitoitetaan erikseen
parisoutuun eikä yksinsoudun määriä vain kaksinkertaisteta.

## Veneet ja kilpailijat

Parisoutuveneet ovat oma tietojoukkonsa. Niillä on nykyisten runkonopeuden,
vastatuulen, vakauden, materiaalin ja painon lisäksi synkronointiherkkyys.
Yksinsoutuveneitä ei voi valita parisoutuun eikä parisoutuveneitä yksinsoutuun.

Parisoutusarjassa myös tietokonevastustajat ovat pareja. Jokaisella parilla on
kaksi nykyisestä soutajadatasta muodostettua soutajaa, yhteinen vene,
synkronointi, taktiikka ja kummankin fysiologinen tila. Sama henkilö ei esiinny
samassa lähdössä kahdessa miehistössä. Miehet, naiset ja sekaparit kilpailevat
omissa tuloslistoissaan; ensimmäisessä versiossa ruudulla näytetään vain pelaajan
sarjan vastustajat.

Nykyistä hyväksyttyä vesireittiä ja kaistansiirtoa ei muuteta. Kartalla
parisoutuvene piirretään hieman pidempänä ja siinä näkyy kaksi soutajaa, mutta
sen reittipiste käsitellään edelleen yhtenä kilpailijana.

## Ennätykset ja tallennukset

Ennätysavain muodostuu kilpailumuodosta ja sarjasta:

- yksinsoutu / miehet tai naiset;
- parisoutu / miehet, naiset tai sekaparit.

Vanha `suursoutu-race-v1`-tallennus tulkitaan aina yksinsouduksi. Uuteen
tallennukseen lisätään `raceType`, kahden soutajan viitteet, tahtisoutajan paikka,
synkronointi ja kummankin kehotila. Muutos tehdään taaksepäin yhteensopivana:
vanhoja tallennuksia ei nimetä uudelleen eikä hylätä. Parisoututallennus
hyväksytään vain, jos kaksi eri, olemassa olevaa soutajaa ja parisoutuvene löytyvät.

## Toteutusjärjestys

1. Lisää kilpailumuodon valinta ja sarjakohtaiset veneet sekä miehistön valinta.
   Pidä kaikki yksinsoudun oletukset ennallaan.
2. Muuta pelaajan tila miehistömuotoon siten, että nykyinen `rower` toimii vielä
   yksinsoudun yhteensopivuuspolkuna. Lisää tallennusmigraatio ja validointitestit.
3. Mallinna toisen soutajan fysiologia, yhteinen etenemisteho ja synkronointi.
   Kalibroi ensin lyhyillä simulaatioilla, sitten koko 58,3 kilometrin kilpailulla.
4. Lisää parisoutuvastustajat, omat tuloslistat ja ennätykset. Säilytä nykyiset
   reitti- ja kaistaturvatestit muuttumattomina.
5. Lisää kahden soutajan karttagrafiikka, HUD, tankkausvalinta, puhe ja
   saavutettavat mobiilikontrollit.
6. Tasapainota veneet ja miehistöt. Varmista, ettei yksi ylivoimainen soutaja
   poista parin valinnan tai synkronoinnin merkitystä.

## Ensimmäisen version hyväksymisehdot

- Yksinsoutu toimii ja vanha tallennus jatkuu kuten ennen.
- Parisoutuun ei voi lähteä yhdellä soutajalla tai samalla soutajalla kahdesti.
- Molempien kunto ja synkronointi vaikuttavat mitattavasti nopeuteen.
- Eväs kohdistuu valittuun soutajaan ja tallentuu oikein.
- Vastustajat ja ennätys kuuluvat pelaajan parisoutusarjaan.
- Kaksi soutajaa näkyy veneessä myös mobiilinäkymässä.
- Parisoutajien reitti pysyy samoissa hyväksytyissä vesikäytävissä kuin
  yksinsoutajien reitti.

Verkkopeliä tai kahden paikallisen pelaajan erillisiä veto-ohjaimia ei sisällytetä
ensimmäiseen versioon. Ne voidaan lisätä myöhemmin ilman, että tässä kuvattu
miehistö-, fysiologia- ja tallennusmalli täytyy rakentaa uudelleen.
