// src/Map.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { POI, randomPOIs } from './POIs';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import { Slider, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, FormControlLabel, Checkbox } from '@mui/material';
import * as turf from '@turf/turf';
import { Feature, GeoJsonProperties, LineString } from 'geojson';
// @ts-ignore
import MarkerClusterGroup from 'react-leaflet-markercluster';
import ElevationChart from './ElevationChart';
import InvertedPOIDistanceChart from './InvertedPOIDistanceChart';


// Calculate the bounds using turf.js
export function calculateBounds(coordinates: number[][]): [[number, number], [number, number]] {
    const line = turf.lineString(coordinates);
    const bbox = turf.bbox(line); // [minX, minY, maxX, maxY]
    return [[bbox[1], bbox[0]], [bbox[3], bbox[2]]]; // [[lat1, lng1], [lat2, lng2]]
}

interface MapProps {
    file: File | null;
}


type SortColumn = 'name' | 'minDistance' | 'routePosition';
type SortOrder = 'asc' | 'desc';


const Map: React.FC<MapProps> = ({ file }) => {
    const [coordinates, setCoordinates] = useState<L.LatLngExpression[]>([]);
    const [nearbyPOIs, setNearbyPOIs] = useState<POI[]>([]);
    const [maxDistance, setMaxDistance] = useState<number>(5); // Default max distance in km
    const [sortColumn, setSortColumn] = useState<SortColumn>('minDistance');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [bufferedLayer, setBufferedLayer] = useState<L.GeoJSON<any>>()
    const [lineSplice, setLineSplice] = useState<Feature<LineString, GeoJsonProperties>>()
    const [showAll, setShowAll] = useState<boolean>(false);  // Track checkbox state
    const [elevationData, setElevationData] = useState<{ distance: number; elevation: number }[]>([]);
    const [maxRoutePosition, setMaxRoutePosition] = useState<number>(0); // Example default max value
    const [routePositionRange, setRoutePositionRange] = useState<number[]>([0, maxRoutePosition]); // Default range for route position
    const [bounds, setBounds] = useState<any>(undefined); // Default range for route position
    const [position, setPosition] = useState<[number, number] | undefined>([48.137154, 11.576124]); // Default range for route position


    function FlyMapTo() {

        const map = useMap()



        useEffect(() => {
            if (bounds) {
                console.log("BOUNDS", bounds)

                map.fitBounds(bounds)
                setBounds(undefined)
            }
        }, [bounds])
        useEffect(() => {
            if (position) {
                console.log("FlyToMapPosition")
                map.setView(
                    position,
                    13
                );
                setPosition(undefined)

            }
        }, [position])
        return null
    }
    // // Calculate the bounds using turf.js
    // function ChangeView(center: any, zoom: number) {
    //     const map = useMap();
    //     map.setView(center, zoom);
    //     return null;
    // }

    // function ChangeView(center: [number, number], zoom: any) {
    //     const map = useMap();
    //     map.setView(center, zoom);
    //     return null;
    // }
    function FlyMapTo2() {

        const map = useMap()

        // useEffect(() => {
        //     if (position) {
        //         map.setView(
        //             position,
        //             13
        //         );
        //     }
        // }, [position])

        useEffect(() => {
            if (bounds) {
                console.log("FlyToMapBounds")
                map.fitBounds(bounds)
            }
        }, [bounds])

        return null
    }



    const parseGPXFile = (gpxData: string): { coordinates: L.LatLngExpression[]; elevationData: { distance: number; elevation: number }[] } => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxData, 'application/xml');
        const trkpts = Array.from(xmlDoc.getElementsByTagName('trkpt'));

        let coordinates: L.LatLngExpression[] = [];
        let elevationData: { distance: number; elevation: number }[] = [];

        // Extract latitude, longitude, and elevation
        const coords = trkpts.map((trkpt) => {
            const lat = parseFloat(trkpt.getAttribute('lat') || '0');
            const lon = parseFloat(trkpt.getAttribute('lon') || '0');
            const ele = parseFloat(trkpt.getElementsByTagName('ele')[0]?.textContent || '0');
            coordinates.push([lat, lon]);
            return { lat, lon, ele };
        });

        // Create a polyline for the entire route and calculate total length in kilometers
        const line = turf.lineString(coords.map(coord => [coord.lon, coord.lat]));


        // Calculate the bounds using turf.js
        let bbox = turf.bbox(line)
        let gpx_bounds = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
        setBounds(gpx_bounds)

        let totalDistance = 0;
        elevationData = [{ distance: 0, elevation: coords[0].ele }]; // Start with the first coordinate's elevation

        for (let i = 1; i < coords.length; i++) {
            // Calculate distance between consecutive coordinates only once
            const point1 = turf.point([coords[i - 1].lon, coords[i - 1].lat]);
            const point2 = turf.point([coords[i].lon, coords[i].lat]);
            const segmentDistance = turf.distance(point1, point2, { units: "kilometers" });

            // Accumulate total distance
            totalDistance += segmentDistance;

            // Store distance and elevation
            elevationData.push({ distance: totalDistance, elevation: coords[i].ele });
        }

        return { coordinates, elevationData };
    };



    const parseGPXFileToNumber = (gpxData: string): number[][] => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxData, 'application/xml');
        const trkpts = xmlDoc.getElementsByTagName('trkpt');
        const coords: number[][] = [];

        for (let i = 0; i < trkpts.length; i++) {
            const lon = parseFloat(trkpts[i].getAttribute('lat') || '0');
            const lat = parseFloat(trkpts[i].getAttribute('lon') || '0');
            coords.push([lat, lon]);
        }
        return coords;
    };


    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log("test")
                const gpxData = e.target?.result as string;
                const { coordinates, elevationData } = parseGPXFile(gpxData);
                setCoordinates(coordinates);
                setElevationData(elevationData);

                const line = turf.lineString(parseGPXFileToNumber(gpxData));

                // Calculate and set the maximum route position
                const routeLength = turf.length(line, { units: "kilometers" });
                setMaxRoutePosition(routeLength);

                // Convert coordinates to Turf.js line
                const filteredStart = turf.along(line, routePositionRange[0], { units: "kilometers" });
                // const filteredEnd = turf.along(line, routePositionRange[1], { units: "kilometers" });
                const filteredEnd = turf.along(line, routeLength, { units: "kilometers" });
                const sliced = turf.lineSlice(filteredStart, filteredEnd, line);
                setLineSplice(sliced);

                // Buffer the sliced route for the maximum distance
                const bufferedTest = turf.buffer(sliced, maxDistance, { units: 'kilometers' });
                const bufferedLayer = L.geoJSON(bufferedTest);
                setBufferedLayer(bufferedLayer);
                setRoutePositionRange([0, routeLength])
                if (bufferedTest) {
                    // Find POIs within the buffered area
                    const ptsWithin = turf.pointsWithinPolygon(
                        turf.points(randomPOIs.map(poi => [poi.lon, poi.lat])), bufferedTest
                    );

                    // Calculate minDistance and closest point on the route for each POI
                    const enrichedPOIs = ptsWithin.features.map((pts, index) => {
                        const poi = {
                            id: index,
                            name: "POI",
                            lat: pts.geometry.coordinates[1] as number,
                            lon: pts.geometry.coordinates[0] as number,
                            description: "Description",
                            type: index % 2 == 0 ? "house" : "hotel"

                        };

                        // Calculate closest point on the route to POI
                        const poiPoint = turf.point([poi.lon as number, poi.lat as number]);
                        const snapped = turf.nearestPointOnLine(sliced, poiPoint);
                        const minDistance = turf.distance(poiPoint, snapped, { units: "kilometers" });
                        const routePosition = turf.length(turf.lineSlice(filteredStart, snapped, sliced), { units: "kilometers" });

                        return {
                            ...poi,
                            minDistance,
                            routePosition,
                            closestPoint: {
                                lat: snapped.geometry.coordinates[1],
                                lon: snapped.geometry.coordinates[0]
                            }

                        };
                    });

                    setNearbyPOIs(enrichedPOIs);
                }
            };

            reader.readAsText(file);
        }
    }, [file, maxDistance]);

    const handleSliderChange = (event: Event, value: number | number[]) => {
        setMaxDistance(value as number);
    };
    const handleRoutePositionChange = (event: Event, newValue: number | number[]) => {
        setRoutePositionRange(newValue as number[]);
    };
    const handleSort = (column: SortColumn) => {
        const isAsc = sortColumn === column && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortColumn(column);
    };

    const sortedPOIs = [...nearbyPOIs].sort((a, b) => {
        let comparison = 0;
        switch (sortColumn) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'minDistance':
                comparison = (a.minDistance ?? Infinity) - (b.minDistance ?? Infinity);
                break;
            case 'routePosition':
                comparison = (a.routePosition ?? Infinity) - (b.routePosition ?? Infinity);
                break;
            default:
                break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });
    // Filter randomPOIs to exclude any that are in nearbyPOIs
    const filteredRandomPOIs = randomPOIs.filter(
        randomPOI => !nearbyPOIs.some(nearbyPOI => nearbyPOI.lat === randomPOI.lat && nearbyPOI.lon === randomPOI.lon)
    );

    return (
        <>
            <MapContainer
                center={[14, 14]}
                zoom={13}
                style={{ height: '500px', width: '100%' }}
            >
                <FlyMapTo />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />

                {bufferedLayer ? <GeoJSON
                    data={bufferedLayer.toGeoJSON()}
                    style={{
                        "color": "#ff7800",
                        "weight": 5,
                        "opacity": 0.65
                    }}
                    key={JSON.stringify(maxDistance) + JSON.stringify(routePositionRange)}
                /> : <></>}

                {coordinates.length > 0 && <Polyline positions={coordinates} color="green" />}

                {lineSplice ? <GeoJSON
                    data={lineSplice}

                    key={JSON.stringify(routePositionRange)}

                /> : <></>}

                {coordinates.length > 0 && (
                    <>
                        <Marker position={coordinates[0]}>
                            <Popup>Start of Route</Popup>
                        </Marker>
                        <Marker position={coordinates[coordinates.length - 1]}>
                            <Popup>End of Route</Popup>
                        </Marker>
                    </>
                )}
                <MarkerClusterGroup showCoverageOnHover={true}>
                    {(showAll ? filteredRandomPOIs : []).map(poi => (
                        <Marker key={`random-${poi.id}`} position={[poi.lat, poi.lon]}>
                            <Popup>
                                <strong>{poi.name}</strong>
                                <br />
                                {poi.description}
                                <br />
                                Random Point
                            </Popup>
                        </Marker>
                    ))}
                    {nearbyPOIs.map(poi => (
                        <Marker key={`nearby-${poi.id}`} position={[poi.lat, poi.lon]}>
                            <Popup>
                                <strong>{poi.name}</strong>
                                <br />
                                {poi.description}
                                <br />
                                Minimum Distance to Route: {poi.minDistance} km
                                <br />
                                Closest Point at: {poi.routePosition} km along the route
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer >


            {/* Elevation Chart */}
            <ElevationChart elevationData={elevationData} maxRoutePosition={maxRoutePosition} />
            <InvertedPOIDistanceChart nearbyPOIs={nearbyPOIs} maxRoutePosition={maxRoutePosition} setPosition={setPosition}  // Pass setPosition to the chart
            />

            {/* Show All Checkbox */}
            <div style={{ margin: '20px' }}>
                <FormControlLabel
                    control={<Checkbox checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />}
                    label="Show All"
                />
            </div>
            <div style={{ margin: '20px' }}>
                <Typography gutterBottom>Max Distance for POIs (km)</Typography>
                <Slider
                    value={maxDistance}
                    onChange={handleSliderChange}
                    aria-labelledby="max-distance-slider"
                    valueLabelDisplay="auto"
                    step={0.5}
                    min={0.5}
                    max={10}
                />
            </div>

            {/* Dual Slider for Route Position
            <div style={{ margin: '20px' }}>
                <Typography gutterBottom>Route Position Range (km)</Typography>
                <Slider
                    value={routePositionRange}
                    onChange={handleRoutePositionChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={maxRoutePosition} // Adjust max as needed based on route length
                />
            </div> */}

            <TableContainer component={Paper} style={{ marginTop: '20px' }}>
                <Table aria-label="POIs table">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={sortColumn === 'name'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('name')}
                                >
                                    Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortColumn === 'minDistance'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('minDistance')}
                                >
                                    Distance to Route (km)
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortColumn === 'routePosition'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('routePosition')}
                                >
                                    Route Position (km)
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedPOIs.length > 0 ? (
                            sortedPOIs.map((poi) => (
                                <TableRow key={poi.id}>
                                    <TableCell>{poi.name}</TableCell>
                                    <TableCell>{poi.description}</TableCell>
                                    <TableCell>{poi.minDistance ?? 'N/A'} km</TableCell>
                                    <TableCell>{poi.routePosition ?? 'N/A'} km</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No nearby POIs found within {maxDistance} km.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default Map;
