# SafeWalk

SafeWalk is a route planning application that helps users find the safest walking routes by considering crime data and providing alternative paths. The application uses real-time crime data and advanced routing algorithms to suggest routes that minimize exposure to high-crime areas.

## Features

- Interactive map interface with crime heatmap overlay
- Route planning with start and end location search
- Multiple transportation modes (walking, cycling, driving)
- Two route options:
  - Fastest: Optimized for shortest distance
  - Safest: Avoids high-crime areas while maintaining reasonable distance
- Route history with localStorage persistence
- Real-time crime data integration
- Estimated travel time and distance calculations

## Technologies Used

- Next.js 14
- React
- TypeScript
- Leaflet for maps
- OpenStreetMap for routing
- NYC Open Data for crime statistics

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
npm run dev
# or
yarn dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
