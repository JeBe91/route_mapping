// src/App.tsx
import React from 'react';
import './App.css';
import Map from './Map';
import { useFile } from './test';

const App: React.FC = () => {
  const { file, setFile } = useFile();  // Use file context to get and set file

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const gpxFile = event.target.files?.[0] || null;
    if (gpxFile) {
      setFile(gpxFile);  // Set the uploaded file in context state
    }
  };

  return (
    <div className="App">
      <h1>Upload GPX File</h1>
      
      {/* File upload input */}
      <input type="file" accept=".gpx" onChange={handleFileUpload} />

      {/* Display the current file name if a file is uploaded */}
      {file && (
        <div className="file-info">
          <p>Current File: {file.name}</p>
          <button onClick={() => setFile(null)}>Remove File</button> {/* Optional: Remove file button */}
        </div>
      )}

      {/* Render the Map component with the current file */}
      <Map file={file} />
    </div>
  );
};

export default App;
