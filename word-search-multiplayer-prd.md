# PRD: WordRush — Real-Time Multiplayer Word Search Game

**Version:** 1.0  
**Author:** Luis  
**Status:** Draft  

---

## 1. Overview

WordRush is a real-time multiplayer word search game for two players. Both players share the same word grid and race to find hidden words first. When a word is found by either player, it is locked for both — marked as claimed by the finder. The player who claims the majority of words by the time the grid is solved wins the match. Players can earn and use powerups to gain a competitive edge.

The game is browser-based, mobile-first, and requires no app installation. Players connect via a shared room code or link with no accounts required.

---

## 2. Goals

- Provide a fun, low-friction, real-time competitive experience for two friends playing remotely
- Work seamlessly on mobile browsers (iOS Safari, Android Chrome)
- Support themed word categories (e.g. animals, food) for variety
- Keep sessions short and replayable (~3–5 minutes per match)

---

## 3. Non-Goals

- No persistent accounts or friend lists
- No more than 2 players per room (1v1 only)
- No leaderboards or cross-session stats
- No native app (web only)
- No AI/bot opponent

---

## 4. Tech Stack Recommendation

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + Vite | Fast dev experience, component-based UI |
| Styling | Tailwind CSS | Mobile-first utility classes |
| Real-time | Socket.io (WebSockets) | Reliable bidirectional state sync |
| Backend | Node.js + Express | Lightweight, pairs naturally with Socket.io |
| Deployment | Railway or Render | Free tier, supports WebSocket servers |
| Word lists | Curated JSON files per category | No external API dependency |

No database is needed — all game state is held in-memory on the server per session and discarded after the match ends.

---

## 5. User Flows

### 5.1 Starting a Game

1. Player 1 visits the app URL.
2. Player 1 selects a word category (e.g. Animals, Food, Travel, Sports, Nature).
3. Player 1 clicks **"Create Room"** — a unique 6-character room code is generated and displayed, along with a shareable link.
4. Player 1 shares the code or link with Player 2 via any channel (SMS, WhatsApp, etc.).
5. Player 2 visits the link or enters the code on the home screen.
6. Player 2 enters a display name (Player 1 is prompted for theirs too if not yet set).
7. Once both players are in the room, a **"Ready"** button appears for each player.
8. When both click Ready, a 3-second countdown begins, then the game starts simultaneously for both.

### 5.2 Playing a Match

1. Both players see the identical word search grid.
2. The word list is shown below or beside the grid (themed words, 10–15 per game).
3. Players drag or tap-and-drag to select letters on the grid.
4. A valid word selection highlights in the player's colour and is immediately broadcast to both screens as claimed.
5. The found word is struck through in the word list with the claiming player's colour.
6. This continues until all words are found.
7. The player who found the majority of words wins.

### 5.3 End of Match

1. When the last word is found, the game ends.
2. A results screen shows: words found by each player, final score, and winner.
3. Both players see a **"Play Again"** button — clicking it prompts a new category selection and restarts the room flow.

---

## 6. Game Mechanics

### 6.1 Grid

- Grid size: 12×12 letters
- Words are placed horizontally, vertically, and diagonally (forward only — no backwards words for readability on mobile)
- Remaining cells are filled with random letters
- The same grid is generated server-side using a seed and sent to both clients to guarantee consistency

### 6.2 Word Lists

Each category contains 20–30 curated words. Each match randomly selects 12 words from the chosen category. Words are between 4–10 characters.

**Initial categories:**
- Animals (e.g. TIGER, DOLPHIN, PENGUIN)
- Food (e.g. PIZZA, MANGO, NOODLE)
- Travel (e.g. PASSPORT, HOTEL, AIRPORT)
- Sports (e.g. TENNIS, CRICKET, SURFING)
- Nature (e.g. FOREST, VOLCANO, GLACIER)

### 6.3 Word Selection (Touch & Mouse)

- **Mobile:** Player taps the first letter, then drags to the last letter; releasing confirms the selection
- **Desktop:** Click and drag from first to last letter
- Visual feedback during drag: letters light up along the path
- Invalid selections (non-words, already claimed) flash red briefly and deselect
- Valid selections animate into the claiming player's colour

### 6.4 Scoring

- Each word found = 1 point for the finder
- No partial credit or time bonuses (keeping it simple)
- Majority wins: with 12 words, 7+ wins; a 6–6 tie is declared a draw

---

## 7. Powerups

Players earn powerups by finding words. Each powerup can be held and activated at any time.

### 7.1 Earning Powerups

- Every **3rd word** a player finds earns them 1 powerup charge (max 2 charges held at once)
- Powerup type is randomly assigned from the available pool when earned

### 7.2 Available Powerups

#### Freeze (⏸)
- **Effect:** The opponent's grid becomes non-interactive for **5 seconds** — they can see the grid but cannot make selections
- **Visual:** Opponent's grid overlaid with an ice/blue tinted freeze effect; a countdown timer appears for both players
- **Cooldown:** Cannot be frozen again for 10 seconds after the freeze wears off (to prevent stacking)
- **Edge case:** If the opponent is mid-drag when freeze activates, their current selection is cancelled

#### Hint (💡)
- **Effect:** One un-found word on the grid is briefly highlighted for the activating player only — a yellow glow traces the word's path for **3 seconds**
- The hint is chosen randomly from the remaining unfound words
- **Edge case:** If only 1 word remains and the opponent is clearly about to find it, the hint still targets that last word
- The hint is private — the opponent does not see it or know it was used

### 7.3 Powerup UI

- Powerup charges displayed as icon badges in the player's HUD
- Tap/click the icon to activate; a confirmation tap is NOT required (immediate activation)
- If no charges are held, the button is greyed out
- An animated notification appears on the activating player's screen when a powerup is earned ("Powerup earned! ⚡")

---

## 8. Real-Time Sync

All game state is authoritative on the server. Clients send events; the server validates and broadcasts.

### 8.1 Key Events

| Event | Direction | Payload |
|---|---|---|
| `player:join` | Client → Server | `{ roomCode, playerName }` |
| `player:ready` | Client → Server | `{}` |
| `game:start` | Server → Both | `{ grid, wordList, seed }` |
| `word:found` | Client → Server | `{ word, startCell, endCell, playerId }` |
| `word:confirmed` | Server → Both | `{ word, playerId, score }` |
| `powerup:activate` | Client → Server | `{ type, playerId }` |
| `powerup:effect` | Server → Both | `{ type, targetPlayerId, duration }` |
| `powerup:earned` | Server → Client | `{ type, playerId }` |
| `game:end` | Server → Both | `{ scores, winner }` |

### 8.2 Conflict Handling

- If two players select the same word at nearly the same time, the server uses message arrival order as the tiebreaker — first received wins
- The losing player's selection is rejected with a flash animation ("Taken!")

### 8.3 Reconnection

- If a player disconnects mid-game, their opponent sees a "Waiting for [name] to reconnect…" message
- The game pauses (no timer — this game is word-count based, not time-based)
- The disconnected player has **30 seconds** to reconnect before the room is closed and the connected player wins by forfeit
- On reconnect, the full current game state is re-sent to the rejoining client

---

## 9. UI & Design

### 9.1 Layout (Mobile-First)

```
┌─────────────────────────────┐
│  You: 4    VS    Friend: 3  │  ← Score header
│  [⏸ Freeze] [💡 Hint]       │  ← Powerup bar (your charges)
├─────────────────────────────┤
│                             │
│      W O R D  G R I D       │  ← Main grid (takes majority of screen)
│         (12 × 12)           │
│                             │
├─────────────────────────────┤
│  Words: TIGER ✓  PIZZA ✓    │  ← Word list (scrollable)
│         HOTEL    MANGO ✓    │
└─────────────────────────────┘
```

- Player's own found words shown in **blue**, opponent's in **orange** (colorblind-safe pair)
- The grid cells are large enough for comfortable touch targets on a 375px wide screen (minimum 28×28px per cell)
- Landscape orientation is supported but portrait is primary

### 9.2 Screens

| Screen | Description |
|---|---|
| Home | App logo, "Create Room" button, "Join Room" input |
| Lobby | Room code display, shareable link, player names, Ready button |
| Countdown | 3-2-1 overlay before game starts |
| Game | Main gameplay screen |
| Results | Winner banner, word tally breakdown, Play Again button |

### 9.3 Animations & Feedback

- Word found: smooth colour sweep animation along the selected path
- Freeze powerup: ripple effect radiates from opponent's name, grid dims
- Hint: pulsing yellow glow along the word path
- Score update: subtle number pop animation
- Incorrect selection: quick red flash and bounce

---

## 10. Edge Cases & Rules

| Scenario | Behaviour |
|---|---|
| Both players find the word at the exact same ms | Server's arrival order decides; loser gets "Taken!" flash |
| Player uses Hint on the last word | Hint highlights that word for 3 seconds as normal |
| Player earns a powerup when already at max (2) | New powerup is discarded; player sees "Powerup lost — full!" warning |
| Freeze is used when opponent is already frozen | The freeze timer resets to 5 seconds (does not stack duration) |
| All words found before anyone uses their powerup | Unused powerups are discarded; results screen shows immediately |
| Player tries to select a diagonal path on a non-diagonal word | Selection is invalid; red flash |
| Player leaves the results screen before both click Play Again | That player's intent to replay is lost; the other player sees "Waiting for opponent..." with a 60s timeout |
| Room code entered incorrectly | "Room not found" error with a prompt to double-check the code |
| Room is full (2/2 players already) | Third visitor sees "This room is full" and is redirected to home |

---

## 11. Performance & Constraints

- Grid generation and word placement must complete in < 200ms server-side
- WebSocket round-trip latency target: < 100ms on a standard mobile connection (4G)
- App must be playable on devices as old as iPhone SE (2020) / mid-range Android
- No loading spinners > 1 second on initial load (use code splitting if needed)
- Word list JSON files should be bundled client-side to eliminate any API latency during gameplay

---

## 12. Out of Scope (Future Iterations)

- Spectator mode
- More than 2 players
- Custom word list entry by players
- Sound effects and music
- Animated themes / skins
- Persistent accounts and win history
- In-game chat
- Additional powerup types (shuffle grid, extra time, etc.)

---

## 13. Success Criteria

The MVP is considered successful when:

1. Two players on separate mobile devices can connect via room code and play a full match with no errors
2. Word found events are reflected on both screens within 500ms
3. Powerups trigger the correct effects on the target player's device
4. The results screen accurately reflects who found each word
5. The game is fully playable on mobile Safari and mobile Chrome

---

*End of PRD*
