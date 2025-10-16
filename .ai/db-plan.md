# Kompletny Schemat Bazy Danych dla 10x Series Matcher

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### Schemat: `app`

Wszystkie tabele aplikacji będą umieszczone w dedykowanym schemacie `app` w celu logicznego odizolowania ich od reszty bazy danych.

```sql
CREATE SCHEMA app;
```

### Tabela: `app.users`

Przechowuje dane uwierzytelniające i podstawowe informacje o użytkownikach.

| Nazwa Kolumny   | Typ Danych     | Ograniczenia                                                                    | Opis                                                                 |
|-----------------|----------------|---------------------------------------------------------------------------------|----------------------------------------------------------------------|
| `id`            | `UUID`         | `PRIMARY KEY`, `DEFAULT uuid_generate_v7()`                                     | Unikalny, sortowalny identyfikator użytkownika (UUIDv7).             |
| `email`         | `TEXT`         | `UNIQUE`, `NOT NULL`, `CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')` | Adres e-mail użytkownika, używany do logowania.                        |
| `username`      | `TEXT`         | `UNIQUE`, `NOT NULL`, `CHECK (length(username) >= 3 AND length(username) <= 50)`   | Unikalna nazwa użytkownika.                                          |
| `hashed_password`| `TEXT`        | `NOT NULL`                                                                      | Zahaszowane hasło użytkownika.                                       |

### Tabela: `app.rooms`

Reprezentuje "pokoje oglądania" tworzone przez użytkowników.

| Nazwa Kolumny     | Typ Danych | Ograniczenia                                           | Opis                                                                 |
|-------------------|------------|--------------------------------------------------------|----------------------------------------------------------------------|
| `id`              | `UUID`     | `PRIMARY KEY`, `DEFAULT uuid_generate_v7()`            | Unikalny, sortowalny identyfikator pokoju (UUIDv7).                  |
| `owner_id`        | `UUID`     | `NOT NULL`, `REFERENCES app.users(id) ON DELETE CASCADE` | Identyfikator właściciela pokoju.                                      |
| `public_link_id` | `UUID`     | `UNIQUE`, `NOT NULL`, `DEFAULT gen_random_uuid()`      | Unikalny identyfikator używany w publicznych linkach zaproszeniowych. |

### Tabela: `app.user_favorite_series`

Tabela łącząca, przechowująca ulubione seriale dla każdego użytkownika.

| Nazwa Kolumny       | Typ Danych | Ograniczenia                                           | Opis                                               |
|---------------------|------------|--------------------------------------------------------|----------------------------------------------------|
| `user_id`           | `UUID`     | `NOT NULL`, `REFERENCES app.users(id) ON DELETE CASCADE` | Identyfikator użytkownika.                         |
| `series_tmdb_id`    | `INTEGER`  | `NOT NULL`                                             | Identyfikator serialu z bazy danych TMDB.          |
| **Klucz główny**    |            | `PRIMARY KEY (user_id, series_tmdb_id)`                | Złożony klucz główny zapewniający unikalność pary. |

### Tabela: `app.room_participants`

Tabela łącząca, śledząca przynależność użytkowników do pokoi.

| Nazwa Kolumny   | Typ Danych | Ograniczenia                                           | Opis                                        |
|-----------------|------------|--------------------------------------------------------|---------------------------------------------|
| `room_id`       | `UUID`     | `NOT NULL`, `REFERENCES app.rooms(id) ON DELETE CASCADE` | Identyfikator pokoju.                       |
| `user_id`       | `UUID`     | `NOT NULL`, `REFERENCES app.users(id) ON DELETE CASCADE` | Identyfikator użytkownika (uczestnika).     |
| **Klucz główny**|            | `PRIMARY KEY (room_id, user_id)`                       | Złożony klucz główny zapewniający unikalność pary. |

### Tabela: `app.recommendations`

Przechowuje rekomendacje seriali wygenerowane przez AI dla każdego pokoju.

| Nazwa Kolumny     | Typ Danych | Ograniczenia                                           | Opis                                                                 |
|-------------------|------------|--------------------------------------------------------|----------------------------------------------------------------------|
| `id`              | `UUID`     | `PRIMARY KEY`, `DEFAULT uuid_generate_v7()`            | Unikalny, sortowalny identyfikator rekomendacji (UUIDv7).            |
| `room_id`         | `UUID`     | `NOT NULL`, `REFERENCES app.rooms(id) ON DELETE CASCADE` | Identyfikator pokoju, dla którego jest ta rekomendacja.              |
| `series_tmdb_id`  | `INTEGER`  | `NOT NULL`                                             | Identyfikator polecanego serialu z bazy danych TMDB.                 |
| `justification`   | `TEXT`     | `NOT NULL`                                             | Uzasadnienie rekomendacji wygenerowane przez AI.                     |

---

## 2. Relacje między tabelami

- **`users` ↔ `rooms` (Jeden-do-wielu)**
  - Jeden użytkownik (`users`) może być właścicielem wielu pokoi (`rooms`).
  - Każdy pokój ma dokładnie jednego właściciela.
  - Relacja zrealizowana przez klucz obcy `rooms.owner_id`.

- **`users` ↔ `user_favorite_series` ↔ `series` (Wiele-do-wielu)**
  - Jeden użytkownik może mieć wiele ulubionych seriali.
  - Jeden serial może być ulubionym dla wielu użytkowników.
  - Relacja zrealizowana przez tabelę łączącą `app.user_favorite_series`. (Uwaga: dane seriali nie są przechowywane w naszej bazie, tylko ich identyfikatory).

- **`rooms` ↔ `room_participants` ↔ `users` (Wiele-do-wielu)**
  - Jeden pokój może mieć wielu uczestników.
  - Jeden użytkownik może być uczestnikiem wielu pokoi.
  - Relacja zrealizowana przez tabelę łączącą `app.room_participants`.

- **`rooms` ↔ `recommendations` (Jeden-do-wielu)**
  - Jeden pokój (`rooms`) może mieć wiele rekomendacji (`recommendations`).
  - Każda rekomendacja należy do dokładnie jednego pokoju.
  - Relacja zrealizowana przez klucz obcy `recommendations.room_id`.

---

## 3. Indeksy

Indeksy są tworzone automatycznie dla kluczy głównych i ograniczeń `UNIQUE`. Poniższe indeksy należy dodać ręcznie w celu poprawy wydajności zapytań opartych na kluczach obcych i często używanych kolumnach.

```sql
-- Indeks do szybkiego wyszukiwania pokoi po linku publicznym
CREATE INDEX idx_rooms_public_link_id ON app.rooms(public_link_id);

-- Indeksy dla kluczy obcych
CREATE INDEX idx_rooms_owner_id ON app.rooms(owner_id);
CREATE INDEX idx_recommendations_room_id ON app.recommendations(room_id);
CREATE INDEX idx_room_participants_user_id ON app.room_participants(user_id); -- Indeks na room_id jest już częścią PK
CREATE INDEX idx_user_favorite_series_user_id ON app.user_favorite_series(user_id); -- Indeks na user_id jest już częścią PK
```

---

## 4. Zasady PostgreSQL (Row-Level Security)

Poniższe zasady RLS ograniczają dostęp do danych na poziomie wierszy w oparciu o tożsamość zalogowanego użytkownika. Wymaga to, aby aplikacja backendowa przed wykonaniem zapytania ustawiła w sesji zmienną z ID użytkownika.

### Funkcja pomocnicza

Funkcja do pobierania ID bieżącego użytkownika z ustawień sesji.

```sql
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS UUID AS $$
BEGIN
  -- Próbuje pobrać 'user_id' i rzutować na UUID. Zwraca NULL jeśli nie istnieje lub format jest niepoprawny.
  RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Aktywacja RLS i definicja polityk

```sql
-- Tabela users
ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own data" ON app.users
  FOR ALL
  USING (id = app.current_user_id());

-- Tabela rooms
ALTER TABLE app.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room owners can manage their own rooms" ON app.rooms
  FOR ALL
  USING (owner_id = app.current_user_id());
CREATE POLICY "Room participants can view rooms they are part of" ON app.rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app.room_participants
      WHERE room_id = id AND user_id = app.current_user_id()
    )
  );

-- Tabela user_favorite_series
ALTER TABLE app.user_favorite_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own favorite series list" ON app.user_favorite_series
  FOR ALL
  USING (user_id = app.current_user_id());

-- Tabela room_participants
ALTER TABLE app.room_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room owners can manage participants" ON app.room_participants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app.rooms
      WHERE id = room_id AND owner_id = app.current_user_id()
    )
  );
CREATE POLICY "Participants can view other participants in the same room" ON app.room_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app.room_participants AS p
      WHERE p.room_id = room_participants.room_id AND p.user_id = app.current_user_id()
    )
  );

-- Tabela recommendations
ALTER TABLE app.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room participants can view recommendations for their rooms" ON app.recommendations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app.room_participants
      WHERE room_id = recommendations.room_id AND user_id = app.current_user_id()
    )
  );
```

---

## 5. Wszelkie dodatkowe uwagi lub wyjaśnienia dotyczące decyzji projektowych

1.  **UUIDv7 jako Klucz Główny**: Użycie sortowalnych UUIDv7 (`id`) jako kluczy głównych upraszcza sortowanie po dacie utworzenia i poprawia wydajność indeksowania w porównaniu do losowych UUIDv4. Wymaga to zainstalowania rozszerzenia `pg_uuidv7` lub zdefiniowania własnej funkcji `uuid_generate_v7()` w PostgreSQL.

2.  **Integralność danych (`ON DELETE CASCADE`)**: Klauzule `ON DELETE CASCADE` na kluczach obcych zapewniają spójność danych. Na przykład, usunięcie użytkownika automatycznie usunie wszystkie jego pokoje, listy ulubionych seriali i uczestnictwa w innych pokojach. Usunięcie pokoju usunie wszystkich jego uczestników i wygenerowane dla niego rekomendacje.

3.  **Triggery (do implementacji)**: Zgodnie z notatkami, logika biznesowa powinna być wspierana przez triggery:
    *   **Automatyczne dodawanie właściciela do uczestników**: Po utworzeniu nowego wiersza w `app.rooms`, trigger powinien automatycznie dodać wpis w `app.room_participants` z `room_id` i `owner_id`.
    *   **Automatyczne czyszczenie rekomendacji**: Zmiana w składzie uczestników pokoju (dodanie lub usunięcie z `app.room_participants`) powinna skutkować usunięciem wszystkich istniejących rekomendacji dla tego pokoju z tabeli `app.recommendations`, ponieważ stają się one nieaktualne.

4.  **Kontekst sesji dla RLS**: Bezpieczeństwo na poziomie wiersza jest w pełni zależne od aplikacji backendowej, która musi przed każdą transakcją bazodanową poprawnie ustawić zmienną sesyjną `request.jwt.claims`. Przykład: `SET "request.jwt.claims" = '{"user_id": "..."}';`.

5.  **Walidacja na poziomie bazy danych**: Użyto podstawowych ograniczeń `CHECK` dla `email` i `username`. Można je rozszerzyć o bardziej rygorystyczne reguły (np. wyrażenia regularne) w zależności od wymagań.
