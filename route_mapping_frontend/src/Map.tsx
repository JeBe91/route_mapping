// src/Map.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { findNearbyPOIs, POI, randomPOIs } from './POIs';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import { Slider, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel } from '@mui/material';
import * as turf from '@turf/turf';
import { buffer } from 'stream/consumers';
import { Feature, GeoJsonProperties, LineString } from 'geojson';

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
    const [routePositionRange, setRoutePositionRange] = useState<number[]>([0, 20]); // Default range for route position
    const [bufferedLayer, setBufferedLayer] = useState<L.GeoJSON<any>>()
    const [lineSplice, setLineSplice] = useState<Feature<LineString, GeoJsonProperties>>()


    const parseGPXFile = (gpxData: string): L.LatLngExpression[] => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxData, 'application/xml');
        const trkpts = xmlDoc.getElementsByTagName('trkpt');
        const coords: L.LatLngExpression[] = [];

        for (let i = 0; i < trkpts.length; i++) {
            const lat = parseFloat(trkpts[i].getAttribute('lat') || '0');
            const lon = parseFloat(trkpts[i].getAttribute('lon') || '0');
            coords.push([lat, lon]);
        }
        return coords;
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
                const gpxData = e.target?.result as string;
                const coords = parseGPXFile(gpxData);
                setCoordinates(coords);



                var line = turf.lineString(parseGPXFileToNumber(gpxData));
                var filteredStart = turf.along(line, routePositionRange[0], { units: "kilometers" });
                var filteredEnd = turf.along(line, routePositionRange[1], { units: "kilometers" });
                var sliced = turf.lineSlice(filteredStart, filteredEnd, line);
                setLineSplice(sliced)

                const nearby = findNearbyPOIs(coords, randomPOIs, maxDistance, routePositionRange);
                // setNearbyPOIs(nearby);


                const bufferedtest = turf.buffer(sliced, maxDistance, { units: 'kilometers' });
                const bufferedLayer = L.geoJSON(bufferedtest);
                setBufferedLayer(bufferedLayer)

      

                if (bufferedtest) {
                    const ptsWithin = turf.pointsWithinPolygon(turf.points(randomPOIs.map(poi => [poi.lon, poi.lat])), bufferedtest);
                    setNearbyPOIs(
                        ptsWithin.features.map(pts => ({
                            id: 1,
                            name: "hallo",
                            lat: pts.geometry.coordinates[1] as number, // Latitude
                            lon: pts.geometry.coordinates[0] as number, // Longitude
                            description: "hallo"
                        }))
                    );
                }





            };
            reader.readAsText(file);
        }
    }, [file, maxDistance, routePositionRange]);
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



    var startTime = performance.now()

    var line = turf.lineString([
        [-77.031669, 38.878605],
        [-77.029609, 38.881946],
        [-77.020339, 38.884084],
        [-77.025661, 38.885821],
        [-77.021884, 38.889563],
        [-77.019824, 38.892368]
    ]);
    var start = turf.point([-77.029609, 38.881946]);
    var stop = turf.point([-77.021884, 38.889563]);

    var sliced = turf.lineSlice(start, stop, line);

    var endTime = performance.now()

    console.log(`Call to doSomething2222 took ${endTime - startTime} milliseconds`)

    return (
        <>
            <MapContainer
                center={[48.137154, 11.576124]}
                zoom={13}
                style={{ height: '500px', width: '100%' }}
            >
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
                {nearbyPOIs.map((poi) => (
                    <Marker key={poi.id} position={[poi.lat, poi.lon]}>
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
            </MapContainer>

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

            {/* Dual Slider for Route Position */}
            <div style={{ margin: '20px' }}>
                <Typography gutterBottom>Route Position Range (km)</Typography>
                <Slider
                    value={routePositionRange}
                    onChange={handleRoutePositionChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={50} // Adjust max as needed based on route length
                />
            </div>

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
