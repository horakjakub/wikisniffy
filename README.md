## WikiSniffy 

### 1. Opis
Aplikacja ma za zadanie umożliwienie wyszukiwania stron ze zbiorów Wikipedii, a także wyświetlanie 10 wyników najbliższych do wyszukiwanej frazy wraz z krótkim opisem i obrazkiem.

### 2. Architektura 
Architektura jest zbliżona do architektury Angulara (MVC) i każdy deweloper znający ten framework powinien dzięki temu szybko połapać się w strukturze. W projekcie nie ma parsowania z pomocą angularowego "$compile", likownia (stawiania watcherów, łączenia ze scopem oraz uruchamianie angularowego cyklu "Digest"). Żeby zastąpić to rozwiązanie i jednocześnie zachować czytelność struktury zaproponowałem następującą architekturę: 

interfejs (DOM eventy) => logika zapytań => obserwator wyników => interfejs (DOM wyświetlanie wyników)

Istotną elementem architektury jest również to że **cały DOM generowany jest po stronie JS** na samym początku uruchomienia wskazanego kontrolera.  
_Propozycja rozwoju_: na pewno dobrze byłoby sprawdzić architekturę pod kątem testów i łatwości developmentu oraz zoptymalizować. Być może w następnej kolejności spróbowałbym dodać routing ze zmianą kontrolera na podstawie URL.

### 3. Deployment 
Wymagania: Node oraz NPM.  Nie dodałem do .gitignore plików main.js, i main.css żeby nie komplikować całości. Nie łączyłem też plików bibliotek do jednego pliku. Buildy w Gulpie są bardzo proste i można by je oczywiście ulepszyć, zrobiłem je raczej symbolicznie (na ile czas pozwolił), tak żeby było wiadomo że wiem o co chodzi.

### 4. Ostylowanie 
W projekcie prawie nie używałem klas, ponieważ już jakiś czas myślałem o prostej stronie opartej w ostylowanie niemalże wyłącznie na zróżnicowanym semantycznie htmlu. Wyjątkiem jest dyrektywa __autocomplete__, gdzie specjalnie wstawiłem ostylowanie z uwzględnieniem metodologii BEM. Warto dodać że zaproponowałem też wstępny podział plików ostylowania dostoswany do architektury MVC. Ostylowanie jest napisane z użyciem jednostek "em" oraz procentów, ale nie zdążyłem dodać żadnych media queries (brak czasu), zatem nie jest w pełni responsywne. W folderze ze  _./styles_, znajduje się dokumentacja w pliku html, na której można testować zachowanie poszczególnych komponentów.

### 5. Wsparcie
Przetestowałem działanie na nowym Firrfoksie, Chromie i Edge. Na bardziej dogłębne testy nie było czasu. 


### 6. TODO 

a.) Stabilność: 
- pokrycie testami,
- ostylowanie przenieść na preprocesor, dodać zmienne,
- dodać testy wizualne,
- dodać wsparcie przglądarek.

b.) Wygląd: 
- poprawić wygląd (bardzo się śpieszyłem), 
- sprawdzić UX.

c.) Performance 
- optymalizacja zapytań (testy i sprawadznie prędkości, optymalizacja obrazów),
- dodać lazy inicjacje modułów, 
- dodać cache'owanie.

d.) Funkcjonalności 
- zmiana języka (wylistowanie dostępnych oraz),
- polepszenie zapytań do obrazów (teraz to jest losowe dosyć),
- obsługa błędów,
- dodać wyszukiwanie zapytania w URL,
- dodać większa liczbę stron niż 10 (następne strony),
- dodać zmiane opcji w autocomplete.

e.) RWD
- uwzględnić media querys, 
- wykonać testy na urządzeniach mobilnych.

f.) Dostępność
- dodać aria-labels,
- dodać tabindexy,
- autocomplete - dodać na strzałki wyszukiwanie. 

g.) Deployment
- dodać do gitignore pliki "main.js" i "main.css", 
- poprawić i zooptymalizować taski w Gulipie,

### 7.Zewnętrzne źródła:

- Modules Pattern:
https://github.com/getify/You-Dont-Know-JS/blob/master/scope%20%26%20closures/ch5.md
- Promise libary:
https://github.com/kriskowal/q
- MediaWiki:
https://github.com/brettz9/mediawiki-js 
Wzięte z listy klientów z wikipedia : https://www.mediawiki.org/wiki/API:Client_code
- reset CSS
http://meyerweb.com/eric/tools/css/reset/