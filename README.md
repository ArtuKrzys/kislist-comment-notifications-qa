# KIS List — test powiadomień o komentarzach

Repozytorium zawiera plan i wyniki testów manualnych oraz jeden test regresyjny E2E w Playwright + TypeScript. Test dotyczy udostępnionej listy, dla której potwierdzono problem z powiadomieniem przypisanego członka zespołu.

## Zakres i reguły biznesowe

| ID | Zdarzenie | Oczekiwani odbiorcy |
| --- | --- | --- |
| P-01 | Klient komentuje propozycję | Wszyscy członkowie zespołu powiązani z listą |
| P-02 | Klient komentuje udostępnioną listę | Wszyscy członkowie zespołu powiązani z listą |
| P-03 | Członek zespołu komentuje element listy | Pozostali członkowie zespołu powiązani z listą, bez autora |

Testowano projekt rekrutacyjny i listę `KOSZTORYS` w KIS List (22.09.2026, Chrome). Do listy byli przypisani właściciel i jeden potwierdzony członek zespołu. Trzecie zaproszenie nie było potwierdzone. W celu zachowania prywatności raport nie zawiera danych logowania, pełnych linków udostępnienia ani zrzutów z danymi kont.

Nie udało się aktywować większej liczby kont pracowników ani współpracowników. Rejestracja wymaga prawdziwego numeru telefonu do odebrania kodu SMS, a w testach nie było dostępnych dodatkowych numerów. Ograniczyło to sprawdzenie powiadomień dla większego zespołu oraz scenariusza z kontem spoza listy.

## Plan testów manualnych

| ID | Typ | Warunki i czynności | Oczekiwany wynik |
| --- | --- | --- | --- |
| P-01 | Pozytywny | Klient dodaje komentarz do wysłanej propozycji. Sprawdzić każdego potwierdzonego członka powiązanego z listą. | Każdy otrzymuje jedno powiadomienie o właściwej propozycji i komentarzu. |
| P-02 | Pozytywny | Klient dodaje komentarz do produktu w udostępnionej liście. Sprawdzić właściciela i pracownika. | Oba konta otrzymują powiadomienie o właściwej liście, produkcie i komentarzu. |
| P-03 | Pozytywny | Członek zespołu dodaje prywatny komentarz do elementu listy. Sprawdzić pozostałe konta. | Pozostali przypisani członkowie otrzymują powiadomienie. |
| N-01 | Negatywny | Autor będący członkiem zespołu sprawdza własny Inbox po dodaniu prywatnego komentarza. | Autor nie dostaje powiadomienia o własnym komentarzu. |
| N-02 | Negatywny | Sprawdzić konto niepowiązane z listą po komentarzu. | Brak powiadomienia dla osoby spoza listy. |
| N-03 | Negatywny | Dodać komentarz do innej listy. | Członkowie niezwiązanej listy nie dostają powiadomienia. |
| N-04 | Negatywny | Spróbować komentować listę bez dostępu. | Brak możliwości dodania komentarza i wygenerowania powiadomienia. |
| B-01 | Brzegowy | Odświeżyć Inbox i ponownie wejść na konto odbiorcy. | Powiadomienie pozostaje dostępne i nie powstaje duplikat. |
| M-01 | Eksploracyjny | Dodać komentarz z oznaczeniem `@` członka zespołu w każdym dostępnym typie komentarza. Sprawdzić autora, osobę oznaczoną i pozostałych członków. | Zweryfikować reguły P-01–P-03 oraz odnotować ewentualne dodatkowe powiadomienia i duplikaty. Mail nie określa osobnych reguł powiadomień dla oznaczeń. |

Każdy test powinien używać rozpoznawalnej, unikalnej treści komentarza. Przy ocenie należy sprawdzić **tożsamość autora**: otwarcie linku klienta w sesji zalogowanego pracownika powoduje zapis komentarza pod jego kontem i nie testuje zdarzenia klienta.

## Wyniki wykonanych testów

| ID | Wynik | Faktyczny rezultat i dowód |
| --- | --- | --- |
| P-02 | **FAIL** | Komentarz w udostępnionej liście został zapisany jako `Klient`. Właściciel zobaczył w Inbox powiadomienie „Klient/ka dodał/a komentarz” z listą `KOSZTORYS` i właściwym produktem. Potwierdzony członek zespołu widział projekt i listę, ale po zalogowaniu nie miał powiadomienia w dzwonku ani Inbox (liczniki `0`). Brak powiadomienia pracownik potwierdził również ręcznie. |
| N-01 | **PASS** | Właściciel dodał prywatny komentarz `QA-N01-20260922` do elementu listy. Komentarz był widoczny przy produkcie; autor nie otrzymał własnego powiadomienia. Powtórzono kontrolę dla komentarza pracownika `QA-P03-1790065421989`: również nie pojawił się w jego Inbox. |
| P-01 | **NIE WYKONANO** | Wcześniej dostępna propozycja była szkicem. W ponownej próbie znaleziono link do przesłanej propozycji, lecz niezalogowany podgląd wyświetlał „PROPOZYCJA NIE JEST JUŻ DOSTĘPNA”, także po odświeżeniu. Nie wysyłano nowej propozycji. |
| P-03 | **FAIL** | Pracownik dodał prywatny komentarz `QA-P03-1790065421989` do produktu „Dywan shaggy - Carvy Arches Kremowy”. Właściciel widział komentarz i autora `Test Test` przy produkcie, ale po ponad minucie i ponownym wejściu do Inbox nie miał powiadomienia z tą treścią. Szczegóły: BUG-002. |
| N-02 | **NIE WYKONANO** | Brak aktywnego konta spoza listy; rejestracja wymaga dodatkowego numeru telefonu i kodu SMS. |
| N-03 | **NIE WYKONANO** | Próba przygotowania drugiej listy nie dała izolacji: pracownik został na niej automatycznie ujęty wśród członków i mógł ją otworzyć. Testową listę przeniesiono do kosza. Nie uznano tej próby za dowód braku powiadomienia u osoby spoza listy. |
| N-04 | **PASS — wariant anonimowy** | Otwarcie prywatnego adresu edycji listy w niezalogowanej sesji przekierowało na `/logowanie`; nie było możliwości dodania tam komentarza. Nie sprawdzano konta zalogowanego bez uprawnień. |
| B-01 | **PASS** | Istniejące powiadomienie właściciela o komentarzu klienta występowało dokładnie raz; po odświeżeniu Inbox i w nowej sesji tego samego konta nadal występowało dokładnie raz. |
| M-01 | **CZĘŚCIOWO** | W Inbox pracownika zastano jedno powiadomienie „Artur Krzysiek oznaczył/a Ciebie w komentarzu” na liście `KOSZTORYS` z treścią `@Test Test ogarnij temat`. Nie wykonano pełnej macierzy oznaczeń dla wszystkich typów komentarzy. |

Wcześniejszy komentarz wpisany w podglądzie klienta przy aktywnej sesji właściciela został zapisany pod jego nazwą. Tę próbę wyłączono z oceny P-02. Nie stanowi dowodu błędu ani poprawnego działania powiadomień klienta.

## BUG-001 — komentarz klienta nie powiadamia przypisanego członka zespołu

**Środowisko:** KIS List, projekt rekrutacyjny, udostępniona lista `KOSZTORYS`, Chrome, 22.09.2026. Właściciel i pracownik są potwierdzonymi członkami listy.

**Kroki odtworzenia:**

1. Otworzyć udostępnioną listę w niezalogowanym oknie jako klient.
2. Dodać komentarz do produktu.
3. Potwierdzić przy produkcie, że autorem komentarza jest `Klient`.
4. Sprawdzić Inbox właściciela listy.
5. Zalogować się na konto potwierdzonego członka zespołu powiązanego z tą samą listą i sprawdzić dzwonek oraz Inbox.

**Oczekiwane:** właściciel i pracownik otrzymują powiadomienie o komentarzu klienta.

**Faktyczne:** powiadomienie pojawia się u właściciela, ale nie u pracownika.

**Waga / priorytet:** Major / High — pracownik może przeoczyć komentarz klienta. Jest to ocena wpływu z perspektywy użytkownika; przyczyna techniczna nie została ustalona.

**Dowód:** zgodność autora komentarza (`Klient`) i powiadomienia właściciela z właściwą listą oraz produktem; na koncie przypisanego pracownika brak powiadomień. Dane i adresy kont pominięto w publicznym raporcie.

## BUG-002 — prywatny komentarz pracownika nie powiadamia właściciela listy

**Środowisko:** ta sama lista `KOSZTORYS`, dwa potwierdzone konta zespołu, Chrome, 22.09.2026.

**Kroki odtworzenia:**

1. Na koncie przypisanego pracownika otworzyć komentarze produktu „Dywan shaggy - Carvy Arches Kremowy” i kartę **Prywatne**.
2. Dodać komentarz bez oznaczenia `@`, np. `QA-P03-1790065421989`.
3. Na koncie właściciela sprawdzić ten sam produkt i Inbox.

**Oczekiwane:** właściciel jako pozostały członek zespołu otrzymuje powiadomienie o komentarzu; autor nie otrzymuje własnego.

**Faktyczne:** komentarz pracownika jest widoczny u właściciela przy produkcie, ale powiadomienie o nim nie pojawia się w Inbox właściciela nawet po ponad minucie i ponownym wejściu. Autor nie otrzymał własnego powiadomienia.

**Waga / priorytet:** Major / High — pozostały członek zespołu może przeoczyć ustalenia pracownika.

**Dowód:** unikalna treść komentarza i jego autor w prywatnych komentarzach po obu stronach, przy braku tej treści w Inbox odbiorcy. Jest to osobna obserwacja manualna; obecny test E2E odtwarza BUG-001.

## Test E2E

Test `tests/comment-notifications.spec.ts` otwiera udostępnioną listę w świeżej, niezalogowanej sesji klienta i dodaje komentarz o unikalnej treści. Następnie sprawdza powiadomienie na koncie właściciela jako kontrolę pozytywną oraz na koncie pracownika. Oczekiwana asercja pracownika **powinna obecnie nie przechodzić**, dopóki błąd nie zostanie naprawiony. Operacje na profil, listę i Inbox znajdują się w obiektach stron w `tests/pages/`; asercje biznesowe pozostają w teście.

Test wymaga dwóch różnych, potwierdzonych kont powiązanych z listą. Logowanie SMS wykonuje się raz dla każdej roli; stan sesji jest zapisany lokalnie w `playwright/.auth/` i wykluczony z Git. [Playwright zaleca przechowywanie plików storage state poza repozytorium](https://playwright.dev/docs/auth), ponieważ mogą zawierać dane pozwalające przejąć sesję.

### Uruchomienie

Wymagane: Node.js 22+ oraz dwa konta testowe (właściciel i przypisany pracownik).

```powershell
npm ci
npx playwright install chromium
Copy-Item .env.example .env
```

W lokalnym `.env` uzupełnij `KIS_SHARED_LIST_URL` linkiem z opcji **„to zobaczy klient”**, `KIS_EDITOR_LIST_URL` linkiem do edycji tej samej listy, `KIS_LIST_NAME` nazwą listy, `KIS_MEMBER_EMAIL` adresem potwierdzonego członka zespołu oraz `KIS_PRODUCT_NAME` dokładną nazwą produktu widocznego w podglądzie (z obrazkiem i przyciskiem „Napisz komentarz”). Linki i adres konta nie mogą trafić do publicznego repozytorium.

```powershell
npm run auth:owner
npm run auth:member
npm test
```

Skrypty `auth:*` otwierają okno Chromium. Zaloguj się odpowiednim kontem, ukończ SMS i dopiero wtedy naciśnij Enter w terminalu. Gdy sesja wygaśnie, powtórz zapis dla tej roli. Jeśli PowerShell blokuje `npm.ps1`, użyj `npm.cmd` zamiast `npm` oraz `npx.cmd` zamiast `npx`.

Test tworzy jeden komentarz na uruchomienie. Wyłączono automatyczne ponawianie, aby ograniczyć liczbę wpisów w środowisku. Raport HTML i trace z nieudanego przebiegu powstają lokalnie; przed udostępnieniem jakichkolwiek artefaktów należy usunąć dane prywatne.

### Status walidacji kodu

`npm run typecheck`, `npm run test:list` i `node --check scripts/save-auth.mjs` zakończyły się poprawnie. `npm audit` nie wykazał znanych podatności. Po zapisaniu sesji obu kont uruchomiono pełny test E2E, także ponownie po wydzieleniu Page Object Model (`npx playwright test tests/comment-notifications.spec.ts`, 45,2 s): komentarz klienta został dodany, powiadomienie właściciela zostało znalezione, a asercja pracownika zakończyła się wynikiem `Expected: 1, Received: 0`. To oczekiwany czerwony wynik testu regresyjnego dla BUG-001. Uruchomienie bez plików sesji kończy się czytelnym błędem konfiguracji przed dodaniem komentarza; nie jest to wynik regresji produktu.

## Ograniczenia i dalsze kroki

- Wynik P-02 dotyczy udostępnionej listy. Komentarza klienta do **wysłanej propozycji** nie testowano z powodu niedostępnego podglądu.
- Nie badano aktywnego konta spoza listy, zmian członkostwa, powiadomień e-mail ani API.
- P-03 potwierdzono manualnie jako drugi problem; automatyzacja obejmuje tylko BUG-001.
- Edytor komentarza nie miał jednoznacznej nazwy dostępnościowej; test używa `contenteditable` z rolą `textbox`. Zalecany stabilny atrybut dla aplikacji: `data-testid="client-comment-editor"`.
- Kontener produktu jest obecnie wyszukiwany względem obrazka i przycisku komentarza. Stabilny `data-testid="client-product-card"` z identyfikatorem produktu ograniczyłby zależność od struktury DOM.
