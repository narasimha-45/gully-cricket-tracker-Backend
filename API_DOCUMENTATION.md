# Gully Cricket Tracker - API Documentation

Base URL: `http://localhost:5000`

---

## 📅 Seasons
Endpoints for managing cricket seasons.

### 1. Get All Seasons
Returns a list of all created seasons.
*   **URL:** `/api/seasons`
*   **Method:** `GET`
*   **Success Response:** `200 OK`

### 2. Create Season
Creates a new season.
*   **URL:** `/api/seasons`
*   **Method:** `POST`
*   **Body:**
    ```json
    { "name": "Season 1" }
    ```

---

## 🏏 Matches
Endpoints for submitting and retrieving match data.

### 1. Submit Match
Submits a completed match with full innings data.
*   **URL:** `/api/matches/submit`
*   **Method:** `POST`
*   **Body:** (Requires complex Match object - see `match.validation.js` for schema)

### 2. Recent Matches
Returns a list of the most recently played matches.
*   **URL:** `/api/matches/recent`
*   **Method:** `GET`

### 3. Matches by Season
Returns all matches played in a specific season.
*   **URL:** `/api/matches/season/:seasonId`
*   **Method:** `GET`

### 4. Match Scorecard
Returns the full scorecard and details for a specific match.
*   **URL:** `/api/matches/:matchId`
*   **Method:** `GET`

---

## 📊 Stats & Profiles
Core endpoints for player/team analytics and leaderboards.

### 1. Player Profile
Returns overall career stats and profile info for a player.
*   **URL:** `/api/stats/player/:name`
*   **Method:** `GET`

### 2. Player Season Stats
Returns player stats for a specific season.
*   **URL:** `/api/stats/player/:name/season/:seasonId`
*   **Method:** `GET`

### 3. Team Profile
Returns overall or season-specific stats for a team.
*   **URL:** `/api/stats/team/:idOrName`
*   **Method:** `GET`
*   **Query Params:**
    *   `seasonId` (Optional): Pass a season ID for specific stats, or `overall` for aggregated stats.

### 4. Rivalry (Batter vs Bowler)
Returns detailed head-to-head stats between a batter and a bowler.
*   **URL:** `/api/stats/rivalry`
*   **Method:** `GET`
*   **Query Params:**
    *   `batter`: Batter name
    *   `bowler`: Bowler name
    *   `seasonId` (Optional): Filter by season or use `overall`.

### 5. Player Comparison (Head to Head)
Compares overall stats of two players.
*   **URL:** `/api/stats/head-to-head/player`
*   **Method:** `GET`
*   **Query Params:**
    *   `player1`: First player name
    *   `player2`: Second player name
    *   `seasonId` (Optional): Compare within a specific season.

### 6. Leaderboards
Returns rankings for different categories.
*   **URL:** `/api/stats/leaderboard/:category/:seasonId`
*   **Method:** `GET`
*   **Categories:** `batting`, `bowling`, `fielding`, `mom`
*   **Overall:** Use the same URLs without `:seasonId` for overall rankings.

---

## 🛡️ Admin
System-level maintenance endpoints.

### 1. Rebuild Analytics
Recalculates all statistics from raw match data. Use this after data migrations or backfills.
*   **URL:** `/api/admin/rebuild-analytics`
*   **Method:** `POST`

---

## 🔍 Search
Global search across the platform.

### 1. Global Search
Search for players, teams, and seasons by query.
*   **URL:** `/api/search?q=...`
*   **Method:** `GET`
