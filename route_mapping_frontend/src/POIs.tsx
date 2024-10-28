export interface POI {
    id: number;
    name: string;
    lat: number;
    lon: number;
    description: string;
    minDistance?: number; // Store minimum distance to the polyline
    routePosition?: number; // Distance along the route where closest point is


}

// Calculate cumulative distances along the route for each coordinate
export const calculateRouteDistances = (coords: L.LatLngExpression[]): number[] => {
    const distances = [0]; // Start point has 0 cumulative distance
    for (let i = 1; i < coords.length; i++) {
        const [lat1, lon1] = coords[i - 1] as [number, number];
        const [lat2, lon2] = coords[i] as [number, number];
        const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2);
        distances.push(distances[i - 1] + segmentDistance);
    }
    return distances;
};

// Helper function to generate a random number within a range
const getRandomInRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

// Function to generate 100 random POIs near a specific location
const generateRandomPOIs = (centerLat: number, centerLon: number, numPOIs: number): POI[] => {
    const pois: POI[] = [];

    for (let i = 0; i < numPOIs; i++) {
        // Generate a random latitude and longitude within +/- 0.05 degrees (~5 km)
        const randomLat = getRandomInRange(centerLat - 0.05, centerLat + 0.05);
        const randomLon = getRandomInRange(centerLon - 0.05, centerLon + 0.05);

        // Create a POI object
        const poi: POI = {
            id: i + 1,
            name: `POI ${i + 1}`,
            lat: randomLat,
            lon: randomLon,
            description: `Description for POI ${i + 1}`,
        };

        pois.push(poi);
    }

    return pois;
};

// Generate 100 POIs near [48.137154, 11.576124]
export const randomPOIs = generateRandomPOIs(48.137154, 11.576124, 100);

// export const pois: POI[] = [
//     { id: 1, name: "Museum", lat: 51.505, lon: -0.09, description: "A great museum." },
//     { id: 2, name: "Park", lat: 51.51, lon: -0.1, description: "A beautiful park." },
//     { id: 3, name: "Restaurant", lat: 51.495, lon: -0.08, description: "A famous restaurant." },
//     // Add more POIs as needed
// ];


// Helper function to calculate distance between two points in kilometers using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Find nearby POIs and track their closest points on the route
export const findNearbyPOIs = (
    coords: L.LatLngExpression[],
    pois: POI[],
    maxDistance: number,
    routePositionRange: number[]
): POI[] => {
    const routeDistances = calculateRouteDistances(coords);
    const nearbyPOIs: POI[] = [];

    pois.forEach((poi) => {
        let minDistance = Infinity;
        let closestRoutePosition = 0;

        for (let i = 0; i < coords.length; i++) {
            const [lat, lon] = coords[i] as [number, number];
            const distance = calculateDistance(poi.lat, poi.lon, lat, lon);

            if (distance < minDistance) {
                minDistance = distance;
                closestRoutePosition = routeDistances[i];
            }
        }

        if (
            minDistance <= maxDistance &&
            closestRoutePosition >= routePositionRange[0] &&
            closestRoutePosition <= routePositionRange[1]
        ) {
            nearbyPOIs.push({
                ...poi,
                minDistance: Math.round(minDistance * 1000) / 1000,
                routePosition: Math.round(closestRoutePosition * 1000) / 1000,
            });
        }
    });

    return nearbyPOIs;
};
