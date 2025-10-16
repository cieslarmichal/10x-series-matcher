# Kompletny Schemat Bazy Danych dla 10x Series Matcher

## Tabele

### Tabela `users`

Przechowuje dane uwierzytelniające i podstawowe informacje o użytkownikach.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator użytkownika (UUIDv7)
- `email` VARCHAR(255) UNIQUE NOT NULL  — Adres e-mail użytkownika, używany do logowania
- `name` VARCHAR(255) NOT NULL CHECK — Imię
- `password` TEXT NOT NULL — Zahaszowane hasło użytkownika

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- Automatyczny indeks na `email` (UNIQUE)
- Automatyczny indeks na `username` (UNIQUE)

---

### Tabela `rooms`

Reprezentuje "pokoje oglądania" tworzone przez użytkowników.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator pokoju (UUIDv7)
- `owner_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator właściciela pokoju
- `public_link_id` VARCHAR(21) — Unikalny identyfikator używany w publicznych linkach zaproszeniowych (nanoid)

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- Automatyczny indeks na `public_link_id` (UNIQUE)
- `CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);` — Dla zapytań filtrujących pokoje po właścicielu

---

### Tabela `user_favorite_series`

Tabela łącząca, przechowująca ulubione seriale dla każdego użytkownika.

**Kolumny:**

- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika
- `series_tmdb_id` INTEGER NOT NULL — Identyfikator serialu z bazy danych TMDB
- PRIMARY KEY (user_id, series_tmdb_id) — Złożony klucz główny zapewniający unikalność pary

**Indeksy:**

- Automatyczny indeks na `(user_id, series_tmdb_id)` (PRIMARY KEY)
- `CREATE INDEX idx_user_favorite_series_series_tmdb_id ON user_favorite_series(series_tmdb_id);` — Dla zapytań wyszukujących użytkowników danego serialu

---

### Tabela `room_participants`

Tabela łącząca, śledząca przynależność użytkowników do pokoi.

**Kolumny:**

- `room_id` UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE — Identyfikator pokoju
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika (uczestnika)
- PRIMARY KEY (room_id, user_id) — Złożony klucz główny zapewniający unikalność pary

**Indeksy:**

- Automatyczny indeks na `(room_id, user_id)` (PRIMARY KEY)
- `CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);` — Dla zapytań wyszukujących pokoje danego użytkownika

---

### Tabela `recommendations`

Przechowuje rekomendacje seriali wygenerowane przez AI dla każdego pokoju.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator rekomendacji (UUIDv7)
- `room_id` UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE — Identyfikator pokoju, dla którego jest ta rekomendacja
- `series_tmdb_id` INTEGER NOT NULL — Identyfikator polecanego serialu z bazy danych TMDB
- `justification` TEXT NOT NULL — Uzasadnienie rekomendacji wygenerowane przez AI

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- `CREATE INDEX idx_recommendations_room_id ON recommendations(room_id);` — Dla zapytań pobierających rekomendacje dla danego pokoju
- `CREATE INDEX idx_recommendations_series_tmdb_id ON recommendations(series_tmdb_id);` — Dla zapytań wyszukujących rekomendacje danego serialu

---

## Relacje między tabelami

- **`users` ↔ `rooms` (Jeden-do-wielu)**
  - Jeden użytkownik (`users`) może być właścicielem wielu pokoi (`rooms`).
  - Każdy pokój ma dokładnie jednego właściciela.
  - Relacja zrealizowana przez klucz obcy `rooms.owner_id`.

- **`users` ↔ `user_favorite_series` ↔ `series` (Wiele-do-wielu)**
  - Jeden użytkownik może mieć wiele ulubionych seriali.
  - Jeden serial może być ulubionym dla wielu użytkowników.
  - Relacja zrealizowana przez tabelę łączącą `user_favorite_series`. (Uwaga: dane seriali nie są przechowywane w naszej bazie, tylko ich identyfikatory).

- **`rooms` ↔ `room_participants` ↔ `users` (Wiele-do-wielu)**
  - Jeden pokój może mieć wielu uczestników.
  - Jeden użytkownik może być uczestnikiem wielu pokoi.
  - Relacja zrealizowana przez tabelę łączącą `room_participants`.

- **`rooms` ↔ `recommendations` (Jeden-do-wielu)**
  - Jeden pokój (`rooms`) może mieć wiele rekomendacji (`recommendations`).
  - Każda rekomendacja należy do dokładnie jednego pokoju.
  - Relacja zrealizowana przez klucz obcy `recommendations.room_id`.
