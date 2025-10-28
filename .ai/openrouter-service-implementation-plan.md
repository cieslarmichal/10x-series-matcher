# OpenRouter Service Implementation Plan

## 1. Opis usługi

Usługa OpenRouter służy do integracji z API OpenRouter w celu uzupełnienia czatów opartych na LLM. Jej głównym zadaniem jest:

1. Komunikacja z zewnętrznym API OpenRouter.
2. Przetwarzanie i formatowanie zapytań, w tym przekazywanie komunikatów systemowych i użytkownika.
3. Zarządzanie odpowiedziami, w tym walidację ustrukturyzowanych odpowiedzi zgodnie z predefiniowanym schematem JSON.
4. Obsługa parametrów modelu, takich jak nazwa modelu oraz parametry konfiguracyjne (np. temperatura, max_tokens itd.).

## 2. Opis konstruktora

Konstruktor usługi powinien inicjować następujące elementy:

- Konfigurację API OpenRouter (klucz API, endpointy, domyślne parametry).
- Wstępne ustawienia dla komunikatów systemowych i użytkownika.
- Schemat response_format, który określa strukturę zwracanych odpowiedzi.
- Ustawienia modelu, takie jak domyślna nazwa oraz parametry (np. tryb pracy, limity tokenów).
- Inicjalizację loggera oraz innych zależności (np. middleware do obsługi błędów).

## 3. Publiczne metody i pola

**Pola (properties):**

1. `apiConfig` - konfiguracja połączenia z OpenRouter.
2. `defaultModel` - domyślna nazwa modelu wykorzystywana w wywołaniach.
3. `responseFormat` - obiekt zawierający schemat odpowiedzi.

**Metody:**

1. `sendRequest(message: string, type: 'system' | 'user'): Promise<Response>`
   - Wysyła zapytanie do API OpenRouter, przyjmując komunikat oraz jego typ (systemowy/użytkownika).

2. `formatResponse(rawResponse: any): StructuredResponse`
   - Przetwarza odpowiedź z API i waliduje ją względem zadeklarowanego schematu JSON.

3. `setModel(modelName: string, parameters: object): void`
   - Ustawia lub aktualizuje konfigurację modelu używanego przy wywołaniach.

4. `getDefaultParameters(): object`
   - Zwraca domyślne parametry modelu, które można modyfikować w razie potrzeby.

## 4. Prywatne metody i pola

**Pola (properties):**

1. `httpClient` - instancja klienta HTTP do komunikacji z API OpenRouter.
2. `logger` -  logger service, reużyj z kodu do rejestrowania zdarzeń, błędów i informacji debugowych.

**Metody:**

1. `preparePayload(message: string, type: 'system' | 'user'): object`
   - Przygotowuje ładunek (payload) do wysłania. Metoda odpowiada za odpowiednie formatowanie komunikatów.
   - Przykład komunikatu systemowego: `"System: Inicjalizacja połączenia z OpenRouter"`.
   - Przykład komunikatu użytkownika: `"User: Proszę o wygenerowanie odpowiedzi"`.

2. `handleApiResponse(rawResponse: any): any`
   - Przetwarza surową odpowiedź API, weryfikuje jej zgodność z `responseFormat` i modyfikuje strukturę odpowiedzi.

3. `handleError(error: Error): void`
   - Prywatna metoda do centralnej obsługi błędów, która loguje zdarzenie i przygotowuje standardowy format błędu do zwrócenia.

## 5. Obsługa błędów

Potencjalne scenariusze błędów oraz sposób ich obsługi:

1. **Błąd połączenia z API**
   - *Wyzwanie:* Brak dostępu do sieci lub błąd po stronie serwera API.
   - *Rozwiązanie:* Retry z wycofaniem (exponential back-off) oraz informacja zwrotna o niedostępności usługi.

2. **Błąd autentykacji/autoryzacji**
   - *Wyzwanie:* Niepoprawny klucz API lub błędne ustawienia połączenia.
   - *Rozwiązanie:* Weryfikacja klucza API oraz zwrócenie czytelnego komunikatu o błędzie autoryzacji.

3. **Błąd walidacji odpowiedzi (response_format)**
   - *Wyzwanie:* Surowa odpowiedź API nie spełnia wymagań określonego schematu JSON.
   - *Rozwiązanie:* Zastosowanie walidacji na podstawie schematu – np. { type: 'json_schema', json_schema: { name: 'ExampleResponse', strict: true, schema: { result: 'string', details: 'object' } } } – oraz procedury obsługi walidacyjnych odstępstw.

4. **Błąd przetwarzania zapytań**
   - *Wyzwanie:* Błędy w formacie komunikatów lub nieprawidłowe parametry modelu.
   - *Rozwiązanie:* Weryfikacja i walidacja danych wejściowych z użyciem mechanizmów typu schema validation.

## 6. Kwestie bezpieczeństwa

1. **Bezpieczne przechowywanie klucza API**
   - Użycie zmiennych środowiskowych oraz systemu zarządzania konfiguracją, np. przy użyciu TypeBox do walidacji.

2. **Ochrona komunikacji**
   - Wymuszenie połączeń HTTPS oraz stosowanie odpowiednich nagłówków bezpieczeństwa.

3. **Walidacja wejścia**
   - Każde zapytanie do usługi musi być walidowane pod kątem poprawności danych, aby zapobiec atakom typu injection.

4. **Ograniczenie dostępu**
   - Implementacja mechanizmów rate limiting i monitoringu błędów, aby zminimalizować ryzyko nadmiernego obciążenia API.

## 7. Plan wdrożenia krok po kroku

1. **Przygotowanie konfiguracji**
   - Zdefiniować zmienne środowiskowe dla połączenia z OpenRouter (klucz API, URL endpointu) i wstępnie skonfigurować parametry modelu.

2. **Implementacja podstawowych komponentów**
   - Utworzyć klasę `OpenRouterService` z konstruktorem inicjującym konfigurację, klienta HTTP oraz loggera.
   - Zaimplementować metody publiczne (`sendRequest`, `formatResponse`, `setModel`, `getDefaultParameters`).

3. **Implementacja metod prywatnych**
   - Wdrożyć `preparePayload` do formatowania komunikatów systemowych i użytkownika.
   - Zaimplementować `handleApiResponse` z walidacją zgodności odpowiedzi z `response_format`.
   - Dodać `handleError` do centralnej obsługi błędów.

4. **Integracja z API OpenRouter**
   - Przetestować komunikację z API używając przykładowych komunikatów:
     - Komunikat systemowy: "System: Uruchomienie instancji usługi OpenRouter"
     - Komunikat użytkownika: "User: Proszę o wygenerowanie rekomendacji"
   - Włączyć obsługę response_format z przykładowym schematem:

       ```json
       { "type": "json_schema", "json_schema": { "name": "ExampleResponse", "strict": true, "schema": { "result": "string", "details": "object" } } }
       ```

5. **Testowanie i walidacja**
   - Przeprowadzić testy jednostkowe sprawdzające poprawność przygotowania payload, walidację odpowiedzi oraz obsługę błędów.
   - Zastosować retry logic w przypadku błędów połączenia.

6. **Przegląd i zabezpieczenie kodu**
   - Upewnić się, że wszystkie dane wejściowe są walidowane, a klucz API jest bezpiecznie przechowywany.
   - Skonfigurować mechanizmy rate limiting oraz monitorowanie błędów.
