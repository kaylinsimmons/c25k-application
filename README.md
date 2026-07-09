# C25K Tracker

A personal **Couch to 5K** fitness tracker — a mobile-friendly web app that times your runs, guides you through walk/run intervals with audio cues, tracks distance via GPS, and saves your progress.

No install or build step required. Works in any modern browser on your phone.

## Features

- **Full 9-week C25K program** — all 27 workouts from the classic Cool Running plan
- **Interval timer** — automatic walk/run transitions with warmup and cooldown
- **Audio cues** — voice announcements ("Start running", "Walk now") plus beeps
- **GPS distance tracking** — tracks how far you run (requires location permission)
- **Run history** — saves completed workouts locally on your device
- **Progress tracking** — marks completed workouts and shows what's next
- **Installable PWA** — add to your phone's home screen for an app-like experience
- **Works offline** — service worker caches the app after first load

## Quick Start

### Option 1: Open directly (simplest)

```bash
cd ~/Projects/c25k-tracker
python3 -m http.server 8080
```

Then open **http://localhost:8080** on your phone (same Wi-Fi) or computer.

> Browsers require HTTPS (or localhost) for GPS and service workers. Use Option 2 for phone testing over the network.

### Option 2: Local HTTPS with ngrok or similar

If you need GPS on your phone over the network, serve with HTTPS.

### On your phone

1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap **Share → Add to Home Screen** (iOS) or **Install app** (Android)
3. Allow **location** when prompted (for distance tracking)
4. Tap **Start** on a workout — audio unlocks after your first tap

## How to Use

1. **Home** — see your next scheduled workout and recent runs
2. **Run** — active workout screen with big timer, phase indicator, and controls
3. **History** — all completed runs with duration and distance
4. **Program** — browse and start any workout in the 9-week plan

### During a workout

- **Start** — begins warmup, GPS, and the interval timer
- **Pause / Resume** — pause mid-workout
- **End** — stop early (progress won't be saved)
- **🔊** — toggle voice and beep cues

## Project Structure

```
c25k-tracker/
├── index.html          # Main app shell
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline support)
├── css/styles.css      # Mobile-first styles
├── js/
│   ├── app.js          # UI and navigation
│   ├── program.js      # C25K workout data
│   ├── timer.js        # Interval timer engine
│   ├── audio.js        # Speech + beep cues
│   ├── gps.js          # Geolocation distance tracking
│   └── storage.js      # localStorage persistence
└── icons/              # PWA icons
```

## Data Storage

All data stays on your device in `localStorage`:

- `c25k-progress` — completed workout IDs
- `c25k-history` — run records (duration, distance, GPS track)

## Customization Ideas

- Adjust intervals in `js/program.js`
- Change colors in `css/styles.css` (`:root` variables)
- Add pace alerts, music integration, or export to CSV
- Later: migrate to React/Vite if you install Node.js

## License

Personal use — build and modify freely.
