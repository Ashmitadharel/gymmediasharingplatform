import React, { useState } from 'react';
import axios from 'axios';

const Metadata = () => {
  const [id, setId] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const fetchMetadata = async (e) => {
    e.preventDefault();

    if (!id) {
      setError('Please enter a file ID.');
      setMetadata(null);
      return;
    }

    setIsLoading(true); // Set loading state to true
    setError('');
    setMetadata(null); // Clear previous data

    try {
      const response = await axios.get(`http://localhost:3002/metadata/${id}`);
      setMetadata(response.data);
    } catch (err) {
      console.error('Error fetching metadata:', err);
      setError('Metadata not found.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div>
      <h2>Retrieve Metadata</h2>
      <form onSubmit={fetchMetadata}>
        <div>
          <label htmlFor="fileId">File ID:</label>
          <input
            type="text"
            id="fileId"
            placeholder="Enter file ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Fetching...' : 'Fetch Metadata'}
        </button>
      </form>
      {metadata && (
        <div>
          <h3>Metadata Details:</h3>
          <p><strong>File Name:</strong> {metadata.FileName}</p>
          <p><strong>Description:</strong> {metadata.Description}</p>
          <p><strong>Upload Date:</strong> {metadata.UploadDate}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Metadata;
