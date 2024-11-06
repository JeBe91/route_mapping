// src/App.tsx
import React from 'react';
import './App.css';
import Map from './Map';
import { useFile } from './test';

const App: React.FC = () => {
  const { file } = useFile();  // Use file context to get and set file


  return (
    <div className="App">
      <Map file={file} />
    </div>
  );
};

export default App;
