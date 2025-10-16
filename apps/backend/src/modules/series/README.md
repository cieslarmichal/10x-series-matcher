# Series Module

The Series module acts as a proxy to the external TMDB (The Movie Database) API, providing TV series search functionality.

## Structure

The module follows the standard module structure:

```
series/
├── application/
│   └── actions/
│       └── searchSeriesAction.ts
├── domain/
│   ├── services/
│   │   └── tmdbService.ts
│   └── types/
│       └── series.ts
├── infrastructure/
│   └── services/
│       └── tmdbServiceImpl.ts
└── routes/
    └── seriesRoutes.ts
```

## Endpoints

### GET /series/search

Searches for TV series by title using the TMDB API.

**Authentication**: Required (access token via Authorization header)

**Query Parameters**:
- `query` (string, required): The search term
- `page` (integer, optional, default: 1): The page number (1-500)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1399,
      "name": "Game of Thrones",
      "posterPath": "/u3bZgnGQ9T01sWNhyveQz0wz0IL.jpg",
      "overview": "Seven noble families fight for control...",
      "firstAirDate": "2011-04-17",
      "voteAverage": 8.4
    }
  ],
  "metadata": {
    "page": 1,
    "pageSize": 20,
    "total": 198
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input (missing query or invalid page number)
- `401 Unauthorized`: Missing or invalid access token
- `502 Bad Gateway`: TMDB API error

### GET /series/:seriesTmdbId

Retrieves detailed information about a specific TV series from TMDB.

**Authentication**: Required (access token via Authorization header)

**URL Parameters**:
- `seriesTmdbId` (integer, required): The TMDB ID of the series

**Response** (200 OK):
```json
{
  "id": 1399,
  "name": "Game of Thrones",
  "posterPath": "/u3bZgnGQ9T01sWNhyveQz0wz0IL.jpg",
  "backdropPath": "/mUkuc2wyV9dHLG0D0Loaw5pO2s8.jpg",
  "overview": "Seven noble families fight for control...",
  "firstAirDate": "2011-04-17",
  "genres": ["Sci-Fi & Fantasy", "Drama", "Action & Adventure"],
  "numberOfSeasons": 8,
  "numberOfEpisodes": 73,
  "status": "Ended",
  "voteAverage": 8.4
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid access token
- `404 Not Found`: Series with the specified TMDB ID not found
- `502 Bad Gateway`: TMDB API error

## Configuration

The module requires TMDB API configuration:

- **Environment Variable**: `TMDB_API_KEY`
- **Config Paths**: 
  - `config.tmdb.apiKey` - Your TMDB API key
  - `config.tmdb.baseUrl` - TMDB API base URL (default: `https://api.themoviedb.org/3`)

Add your TMDB API key to the appropriate config file:
- `config/development.json` for local development
- Environment variable `TMDB_API_KEY` for production

## Implementation Details

### Domain Layer

- **TmdbService**: Interface defining the contract for TMDB API operations
- **Series**: Type representing a TV series with normalized property names
- **SeriesSearchResult**: Type representing paginated search results

### Infrastructure Layer

- **TmdbServiceImpl**: Concrete implementation that communicates with the TMDB API
  - Uses fetch API for HTTP requests
  - Maps TMDB API response format to domain types
  - Handles API errors and wraps them in `ExternalServiceError`

### Application Layer

- **SearchSeriesAction**: Action that orchestrates series search
  - Validates input
  - Delegates to TmdbService
  - Returns typed results

### Routes Layer

- **seriesRoutes**: Fastify plugin that registers the `/series/search` endpoint
  - Uses TypeBox schemas for request/response validation
  - Applies authentication middleware
  - Maps domain types to response DTOs

## Error Handling

The module uses custom error classes:
- `InputNotValidError`: For invalid search queries or page numbers
- `ExternalServiceError`: For TMDB API communication failures

These errors are automatically mapped to appropriate HTTP status codes by the global error handler.

