---
title: 'Fördela träningstider i idrottshall utan schemakaos'
date: '2026-11-08'
excerpt: 'Hur idrottsföreningar fördelar kommunala halltider rättvist utan dubbelbokningar, och varför en CSP-lösare avlastar manuella kalkylark.'
tags: ['courtpuzzle', 'idrottsforening', 'traningstider', 'lokalbokning', 'schemalaggning']
---

# Fördela träningstider i idrottshall utan schemakaos

Varje år i maj och augusti upprepas samma procedur i Sveriges idrottsföreningar. Kommunen skickar ut beslutet om säsongens halltilldelning. Föreningen får ett underlag med beviljade tider utspridda över idrottshallar och skolgympasalar i stadsdelen.

Sedan börjar det verkliga arbetet: att fördela dessa tider mellan föreningens alla barn-, ungdoms- och seniorlag utan att ledare tvingas sluta på grund av tidsbrist eller att två lag dyker upp i samma hall samtidigt.

Det här inlägget beskriver varför manuella kalkylark blir svåra att överblicka när schemat växer, hur vi byggde [CourtPuzzle](https://courtpuzzle.com) för att lösa pusslet matematiskt, och vad vi lärde oss under pilotarbetet med basketklubben Lundby Basket i Göteborg.

## Det kommunala utgångsläget

De flesta svenska föreningar äger inga egna idrottsanläggningar. Vi hyr tider av kommunens idrotts- och föreningsförvaltning, till exempel via bokningssystem som Göteborgs Stads [goteborg.se](https://goteborg.se/) eller Interbook och Rbok i andra kommuner.

Tilldelningen man får är sällan den man önskade. Attraktiva vardagskvällar mellan 17:00 och 20:00 är hårt eftertraktade och räcker sällan till alla grupper. Sena fredagskvällar och tidiga söndagsmorgnar finns det ofta gott om, men de tiderna sliter på barnfamiljer och ideella krafter.

Att lägga schemat handlar i praktiken om att omvandla en spretig bunt kommunala halltider till en fungerande vardag för hundratals familjer.

## Varför kalkylarket blir svårt att hantera

I arbetet med att pussla ihop säsongen i ett kalkylark uppstår tre återkommande problem:

1. **Osynliga dubbelbokningar:** Det är lätt att råka placera två träningsgrupper i samma idrottshall samma tisdag klockan 18:00. Felet upptäcks ibland först i september när sextio barn och fyra förvirrade ledare står i hallen samtidigt.
2. **Ledarnas vardagspussel:** Många ledare är ideella föräldrar som behöver få träningarna att fungera med arbete och pendling. En ledare kan bara tisdagar och torsdagar efter 17:30. En annan tränar två olika lag och kan inte befinna sig i två skolor på motsatta sidor av staden med överlappande tider eller otillräcklig restid.
3. **Kaskadeffekten vid ändringar:** I oktober meddelar skolan att idrottshallen stängs för underhåll eller skolaktiviteter. Om ett lag flyttas för att lösa luckan krockar tränaren ofta med sitt andra lag. Justeras då tränarens andra tid försvinner en bokning för en annan träningsgrupp. Ett manuellt kalkylark kontrollerar inte villkoren automatiskt när ändringar görs i efterhand.

Det som ser ut som ett kalenderproblem är i grunden ett kombinatoriskt optimeringsproblem.

## Från manuellt pussel till en CSP-lösare

Inom datavetenskap formuleras den här typen av planering som ett villkorsproblem, eller Constraint Satisfaction Problem (CSP). I stället för att en människa manuellt flyttar rutor fram och tillbaka i ett kalkylark definierar man tre komponenter:

- **Variabler:** Varje träningspass som ska schemaläggas för respektive lag under veckan.
- **Domäner:** De tillåtna kombinationerna av hall och tid som föreningen faktiskt har blivit tilldelad av kommunen.
- **Hårda villkor (Constraints):** Regler som inte får brytas i en giltig lösning. Två pass kan inte dela samma halltid. En ledare kan inte vara på två platser samtidigt. Föreningens yngsta lag ska inte tilldelas pass med sen sluttid.

I [CourtPuzzle](https://courtpuzzle.com) placerar lösaren passen deterministiskt. Ett schema som lösaren godkänner har noll kollisioner mot de uppsatta villkoren.

Om schemat inte går ihop visar CourtPuzzle vilka villkor som krockar med varandra. Systemet förklarar varför en giltig placering saknas, till exempel att tre lag kräver tisdagar mellan 17:00 och 18:30 i en stadsdel där föreningen bara har två tilldelade halltider. Det ger schemaläggaren ett sakligt underlag i stället för timmar av manuellt letande efter fel.

## Enkla ledarlänkar utan inloggningskrav

Ett vanligt misstag i föreningssystem är att tvinga alla ideella ledare att skapa konton och ladda ner nya appar bara för att svara på när de kan träna. Resultatet blir ofta uteblivna svar och mer tidsödande uppföljning via sms och mejl.

I CourtPuzzle skickas en personlig, tidsbegränsad direktlänk (magic link) till varje ledare. Ledaren öppnar länken i mobilen, anger när de kan träna och sparar. Ingen registrering krävs och inget lösenord behöver kommas ihåg.

De sparade svaren används sedan som hårda villkor vid schemaläggningen.

## En delningslänk som håller sig uppdaterad

Det traditionella sättet att distribuera träningstider är att exportera en PDF och mejla ut den eller lägga upp den på föreningens webbplats. Efter två veckor ändras en tid, en ny PDF skickas ut, och snart cirkulerar flera versioner i föräldrarnas chattgrupper.

CourtPuzzle publicerar schemat till en skrivskyddad webblänk som vem som helst med länken kan läsa utan inloggning. Spelare och föräldrar kan bokmärka sidan i mobilen.

Om kommunen ändrar en tilldelad tid uppdaterar schemaläggaren uppgifterna i appen, kör lösaren och publicerar på nytt. Samma länk visar omedelbart det uppdaterade schemat för hela föreningen. För dem som behöver underlaget i andra format finns även export till Excel, iCal-kalenderflöde och Markdown.

## Erfarenheter från Lundby Basket

CourtPuzzle utvecklas i Göteborg och har körts som en aktiv pilot tillsammans med basketklubben Lundby Basket. Klubbens erfarenheter av ungdomslag, spridda träningstider i kommunala hallar och engagerade ideella ledare har gett värdefull återkoppling på hur verktyget formats.

Verktyget gör en enda sak: att fördela veckans träningstider kollisionsfritt över föreningens tilldelade hallar enligt uppsatta villkor. Vi hanterar inte medlemsavgifter, närvarorapportering eller matchchatt. För de delarna finns etablerade system som Svenskalag, Sportadmin och Spond. CourtPuzzle fokuserar på schemapusslet inför säsongen och håller planeringen uppdaterad när halltider ändras.

## Kom igång

Föreningar kan testa verktyget kostnadsfritt med upp till två hallar och tre lag, med tillgång till lösaren och exportfunktioner. För större föreningar finns ett säsongspass för sex eller tolv månader som täcker klubbens lag och ledare.

Läs mer och prova på [courtpuzzle.com](https://courtpuzzle.com), eller läs sammanfattningen på [Applicaudia CourtPuzzle](/apps/courtpuzzle/).
