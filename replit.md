# CYBER WhatsApp Bot — Project Overview

## What this project is
A multi-device WhatsApp bot (CYBER / DIGITAL DON) built with Node.js and the Baileys library. Includes a Telegram management panel for session pairing.

## Entry Point
- `node index.js` (or `npm start`)

## Key Files
- `index.js` — Main entry, loads config, starts bot subsystems
- `pair.js` — WhatsApp socket connection & event handling
- `case.js` — All command logic (~13,600 lines)
- `bot.js` — Telegram management panel
- `setting/config.js` — Global config (owner, prefix, bot name)
- `allfunc/` — Utility helpers (storage, exif, etc.)
- `database/` — Persistent JSON data files

## Architecture
- `pair.js` receives raw Baileys events and passes them to `case.js` via `require("./case")(nexus, mek, chatUpdate, store)`
- Private/Public mode stored in `database/bot_mode.json` and restored on startup

## Social Media Downloaders (PrinceTech API — apikey=prince)
| Command | Aliases | API endpoint |
|---|---|---|
| `.fb` | `.fbdl`, `.facebook` | `/api/download/facebook` |
| `.ig` | `.igdl`, `.instagram` | `/api/download/instadl` |
| `.twitter` | `.twit`, `.twitterdl`, `.xdl` | `/api/download/twitter` |

## Anti-Features
| Command | Aliases | Description |
|---|---|---|
| `.antiedit on\|private\|off` | `.ae` | Track edited messages — chat mode or private (owner DM) |
| `.antidelete on\|off` | `.antidel`, `.adel` | Track deleted messages, recover media, send to owner DM |

## Download Commands
| Command | Aliases | Description |
|---|---|---|
| `.video` | `.ytmp4`, `.mp4`, `.ytvideo` | YouTube video downloader (Gifted API) with quality selection (144p–1080p). Reply 1-5 to choose quality. |
| `.dlstatus` | `.swdl`, `.statusdl` | Download a quoted WhatsApp status (owner only) |
| `.movie` | `.film`, `.imdb` | Search movie info via OMDB API |

## View-Once (VV) Commands
| Command | Aliases | Description |
|---|---|---|
| `.vv` | `.vvgh` | Silently saves view-once media to bot inbox. Only reacts with ✅ |
| `.vv2` | `.readviewonce2` | Silently saves view-once media to bot inbox. Only reacts with ✅ |
| Emoji triggers | 😭🌚🤭🔥😋😊😘😎 | Reply to any media with these emojis to silently save to bot inbox |

## Auto Status Features
| Command | Description |
|---|---|
| `.autoviewstatus on/off` | Auto-view WhatsApp statuses |
| `.autostatusreact on/off` | Auto-react to statuses with random emojis |
| `.autostatusreply on [message]` / `.autostatusreply off` | Auto-reply to status posters with a custom message |

## Mode System
- `.public` — Bot responds to everyone, saves to `database/bot_mode.json`
- `.private` / `.self` — Bot only responds to bot owner + bot number, saves to `database/bot_mode.json`
- Mode persists across restarts (loaded in `pair.js` on connect)

## Global Stores (in-memory)
- `global._antieditStore` — Map of chatId → Map of msgId → message (24h TTL)
- `global._antideleteStore` — Map of msgId → `{content, mediaType, mediaPath, sender, group}`

## Config Files (database/)
- `antiedit_config.json` — `{ mode: "false"|"chat"|"private" }`
- `antidelete_config.json` — `{ enabled: false|true }`
- `bot_mode.json` — `{ mode: "public"|"self" }`
