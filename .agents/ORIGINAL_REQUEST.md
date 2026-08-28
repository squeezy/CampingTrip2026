# Original User Request

## Initial Request — 2026-08-28T23:33:22+07:00

Conduct a comprehensive UX and usability overhaul on the EV Camping Trip web application at `d:\Project\CampingTrip`.
Refactor the web app to be radically clean, minimalist, and frictionless for 2-car convoy drivers.

### Requirements:
- **R1. Elimination of Redundancy & Information Overload**: Consolidate overlapping views and text walls into a clean, unified interface. Use progressive disclosure so key trip information (Route, Chargers, Food, 2-Car Camp Calculator) is instantly scannable without overwhelming the user.
- **R2. Mobile Driver-First UX & Ergonomics**: Optimize UI for one-thumb mobile interaction during a road trip. Ensure large, comfortable tap targets (minimum 44x44px), high contrast readability under daylight conditions, and seamless 1-tap Google Maps navigation for all stops.
- **R3. Interactive Map & Stop Cards Polish**: Ensure the Leaflet interactive map and stop cards are synchronized, easy to interact with on mobile without getting stuck in touch-scrolling traps, and provide clear distinction between Outbound and Inbound journey phases.
- **R4. Streamlined 2-Car EV Simulator**: Simplify the 2-car battery comparison tool into an intuitive visual widget where users can quickly understand their overnight AC power budget and morning range with zero confusion.

### Acceptance Criteria:
- No redundant tabs or duplicated information across views.
- Visual hierarchy allows users to identify nearest charging hubs and food options in under 5 seconds.
- All interactive elements (map markers, popups, buttons, sliders) work smoothly on mobile and desktop without layout shifts.
- Code is clean, maintainable, and passes syntax validation (`node --check` on JS files).
- Output changes are committed to the local repository.
