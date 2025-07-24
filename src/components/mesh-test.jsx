import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

const MeshTest = () => {
  const [meshImage, setMeshImage] = useState(null);

  const createTestMesh = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    // Create a simple test mesh
    ctx.fillStyle = '#FF1493';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some mesh lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(270, 50);
    ctx.lineTo(270, 190);
    ctx.lineTo(50, 190);
    ctx.closePath();
    ctx.stroke();
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText('Test Mesh', 120, 120);
    
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = dataURL.split(',')[1];
    
    console.log('🎨 Test mesh created, length:', base64Data.length);
    setMeshImage(base64Data);
  };

  return (
    <Box sx={{ p: 2, border: '2px solid #FF1493', borderRadius: '12px', maxWidth: '400px' }}>
      <Typography variant="h6" sx={{ color: '#FF1493', mb: 2 }}>
        Mesh Display Test
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={createTestMesh}
        sx={{ mb: 2, backgroundColor: '#FF1493' }}
      >
        Create Test Mesh
      </Button>
      
      {meshImage ? (
        <Box>
          <Typography variant="body2" sx={{ color: '#00ff00', mb: 1 }}>
            ✅ Mesh loaded successfully
          </Typography>
          <img 
            src={`data:image/jpeg;base64,${meshImage}`} 
            alt="Test Mesh" 
            style={{ 
              width: '100%', 
              maxWidth: 320, 
              height: 'auto', 
              borderRadius: 8, 
              border: '2px solid #00ff00'
            }} 
          />
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: '#666' }}>
          No mesh image loaded
        </Typography>
      )}
    </Box>
  );
};

export default MeshTest; 