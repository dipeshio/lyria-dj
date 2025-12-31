# PromptDJ Retro

A retro-styled control interface for Google's Lyria RealTime (Music) API, featuring the "Claude Academic Retro" aesthetic.

## Features

- 🎵 **Preset Moods**: Lofi Study, Soft Classical, Deep Ambient, Chaos Jazz
- 🎛️ **Custom Prompts**: Describe any soundscape
- 🔘 **Parameter Knobs**: BPM, Guidance, Temperature, Density
- 📜 **Retro Design**: Academic print-style with Merriweather serif

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your API key in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Framer Motion
- @google/genai (Lyria RealTime)

## Design System

Colors:
- Paper: `#F5F3EE`
- Charcoal: `#1F1E1D`  
- Terracotta: `#C15F3C`
- Muted: `#B1ADA1`

Font: Merriweather (serif)
