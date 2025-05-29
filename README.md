# SafeWalk

SafeWalk is a route planning application that helps users find the safest walking routes by considering crime data and providing alternative paths. The application uses real-time crime data and advanced routing algorithms to suggest routes that minimize exposure to high-crime areas.

## Features

- **Interactive Map:** Visualize routes and crime density with a Leaflet-based map.
- **Crime Heatmap:** Overlay real-time crime data on the map to identify high-crime areas.
- **Smart Route Planning:** Get optimized routes based on your preferred mode and safety considerations.
- **Multiple Transportation Modes:** Plan routes for walking, cycling, and driving.
- **Route Options:** Choose between the Fastest (shortest distance) and Safest (crime avoidance) routes.
- **Real-time Crime Data:** Integrates with NYC Open Data for up-to-date crime statistics.
- **Location Search:** Easily find start and end points using a search bar with auto-suggestions.
- **Route History:** Save and load previous route searches using local storage.
- **Estimated Travel Time & Distance:** Get clear information about your planned journey.
- **Responsive UI:** The application adapts to different screen sizes for a seamless mobile and desktop experience.
- **Custom Markers:** Distinct visual markers for start and end locations.

## Technologies Used

- **Frontend:**
  - Next.js 14: React framework for building the user interface with server-side rendering.
  - React: JavaScript library for building interactive user interfaces.
  - TypeScript: Adds static typing for improved code quality and maintainability.
  - TailwindCSS: Utility-first CSS framework for rapid and responsive styling.
  - Leaflet.js: Open-source JavaScript library for creating interactive maps.

- **Data & APIs:**
  - NYC Open Data (NYPD Complaint Data): Provides the crime statistics used for the heatmap and safest route calculations.
  - OpenStreetMap: A free and open worldwide geographic dataset, used for map tiles.
  - OpenStreetMap Routing / OSRM API: Provides the routing engine for calculating paths for different transportation modes.
  - Nominatim OpenStreetMap API: Used for geocoding (converting addresses to coordinates) and location search suggestions.

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Soulemane12/SafeWalk.git
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
bun install
```

3. Run the development server:
```bash
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
