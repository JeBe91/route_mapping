// src/App.tsx
import React, { useState } from 'react';
import './App.css';
import Map from './Map';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const gpxFile = event.target.files?.[0] || null;
    if (gpxFile) {
      setFile(gpxFile);  // Set the uploaded file in state
    }
  };

  return (
    <div className="App">
      <h1>Upload GPX File</h1>
      <input type="file" accept=".gpx" onChange={handleFileUpload} />
      <Map file={file} />
    </div>
  );
};

export default App;
