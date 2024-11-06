export interface POI {
    id: number;                      // Unique identifier for each POI
    name: string;                    // Name of the POI
    lat: number;                     // Latitude of the POI
    lon: number;                     // Longitude of the POI
    description: string;             // Description of the POI
    minDistance?: number;             // Minimum distance to the closest point on the route, in kilometers
    routePosition?: number;           // Distance along the route to the closest point, in kilometers
    closestPoint?: {                  // Coordinates of the closest point on the route
        lat: number;
        lon: number;
    };
    type: string; // "house", "tent", "hotel", etc.

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

// Utility function to generate a random number within a range
const getRandomInRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

// Modified function to generate around 3000 POIs within Germany's bounding box
const generateRandomPOIs = (numPOIs: number = 3000): POI[] => {
    const pois: POI[] = [];

    // Define approximate bounds for Germany
    const minLat = 47.0;
    const maxLat = 55.0;
    const minLon = 5.9;
    const maxLon = 15.0;

    for (let i = 0; i < numPOIs; i++) {
        // Generate a random latitude and longitude within Germany's bounds
        const randomLat = getRandomInRange(minLat, maxLat);
        const randomLon = getRandomInRange(minLon, maxLon);

        // Create a POI object
        const poi: POI = {
            id: i + 1,
            name: `POI ${i + 1}`,
            lat: randomLat,
            lon: randomLon,
            description: `Description for POI ${i + 1}`,
            type: i % 2 == 0 ? "house" : "tent"
        };

        pois.push(poi);
    }

    return pois;
};

// Example usage
const pois = generateRandomPOIs(); // Generates 3000 POIs within Germany

// Generate 100 POIs near [48.137154, 11.576124]
export const randomPOIs = generateRandomPOIs();

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
