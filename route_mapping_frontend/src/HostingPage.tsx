// src/HostingPage.tsx

import React, { useState } from 'react';
import { TextField, Button, Typography, List, ListItem, ListItemText, Container } from '@mui/material';

// Define the Location type for the location entries
interface Location {
  id: number;
  name: string;
  address: string;
  description: string;
}

const HostingPage: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [locations, setLocations] = useState<Location[]>([]); // Fake database for locations

  // Handle form submission
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();

    // Create a new location entry
    const newLocation: Location = {
      id: locations.length + 1,
      name,
      address,
      description,
    };

    // Add new location to our fake database (locations state)
    setLocations([...locations, newLocation]);

    // Clear input fields
    setName('');
    setAddress('');
    setDescription('');
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Add a New Hosting Location
      </Typography>
      <form onSubmit={handleAddLocation}>
        <TextField
          label="Location Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Save Location
        </Button>
      </form>

      {/* Display saved locations */}
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Saved Locations
      </Typography>
      <List>
        {locations.map((location) => (
          <ListItem key={location.id}>
            <ListItemText
              primary={location.name}
              secondary={`${location.address} - ${location.description}`}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default HostingPage;
