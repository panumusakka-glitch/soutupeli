# Sulkavan Suursoutu: 3D-kilpailuversion luonnos

Ensimmäinen tavoite on lyhyt pelattava kilpailutesti nykyisen 2D-pelin rinnalle. Varsinainen Partalansaaren kilpailu säilyttää 5–8 tunnin keston. Testiosuus helpottaa kameran, vedon ja vastustajien kokeilemista.

## Näkymä ja ohjaus

Kamera kulkee oman veneen takana ja hieman yläpuolella. Veneen liuku, kallistuminen, airojen liike, veden vastus ja lähellä olevat kilpaveneet näkyvät selvästi. Kameran heilahtelu pidetään pienenä mobiilia varten. Nykyinen vedon painallus ja irrotus säilyvät; reittiä seurataan aluksi automaattisesti. Nopeus, kehon mittarit ja eväät säilyvät ruudulla.

## Kilpailijat

Ensimmäisessä testissä 6–10 tietokoneen ohjaamaa soutajaa. Jokaisella ovat nykyiset soutaja- ja veneominaisuudet sekä oma tahti, väsymys ja tankkaus. Veneiden nopeus syntyy samasta simulaatiosta kuin pelaajalla. Vastustajat valitsevat sivuttaisen ajolinjan ohitukseen ja välttävät rantoja ja muita veneitä. Sijoitus ja aikaero edellä soutavaan näkyvät mittaristossa. Verkkopeli on erillinen myöhempi vaihe, sillä yhteinen kilpailukello, katkokset ja tallennus tarvitsevat palvelimen.

## Maasto ja reitti

Nykyinen kuvasta poimittu reitti sopii prototyypin pohjaksi, mutta sitä ei pidä esittää tarkkana maastomallina. Varsinaiseen 3D-versioon hankitaan käyttöehdoiltaan sopivat rantaviiva- ja korkeustiedot, joista muodostetaan Partalansaari, ympäröivät saaret ja vesiväylät. Lähtö Hakovirran sillalta ja maali soutustadionilla. Lepistönselän tuuli vaikuttaa aaltoihin ja veneeseen; Kietävälän vastavirta veden liikkeeseen ja etenemisnopeuteen.

## Toteutusjärjestys

1. Irrota soutu- ja kehosimulaatio nykyisestä piirtokoodista. Sama pelitila palvelee 2D- ja 3D-näkymää.
2. Rakenna rajattu vesialue, yksi vene, liikkuvat airot ja kamera. Liitä nykyinen veto-ohjaus, äänet ja mobiilimittarit.
3. Lisää kilpailijat, ohituslinjat, sijoitus ja aikaerot. Testaa ennen koko saaren maastotyötä, tuntuuko rinnakkain soutaminen kilpailulta.
4. Laajenna koko reittiin ja lisää tunnistettavat rannat ja maamerkit. Käytä yksinkertaisia malleja, vähän varjoja ja etäisyyden mukaan vähenevää yksityiskohtaisuutta.
5. Lisää pitkän kilpailun tallennus ja jatkaminen sekä säädä vaikeustaso. Tavoittele mobiilissa tasaista vähintään 30 ruudun sekuntinopeutta; karsi veden ja varjojen tehosteita ensin.

Tämä on toteutussuunnitelma. 3D-näkymää tai kilpailijoita ei ole vielä rakennettu.
