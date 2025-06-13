import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Upload as UploadIcon, Delete as DeleteIcon, Share as ShareIcon } from '@mui/icons-material';
import axios from 'axios';
import { config } from '../config/config';

const InstructorDashboard = () => {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post(`${config.API_URL}/upload-video`, formData);
      setVideos([...videos, {
        id: response.data.id,
        title: file.name,
        uploadDate: new Date().toISOString(),
        transcript: response.data.transcript
      }]);
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleShare = (videoId) => {
    const link = `${window.location.origin}/instructor/${videoId}`;
    setShareLink(link);
    setSelectedVideo(videoId);
  };

  const handleDelete = async (videoId) => {
    try {
      await axios.delete(`${config.API_URL}/videos/${videoId}`);
      setVideos(videos.filter(video => video.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Instructor Dashboard
      </Typography>

      {/* Upload Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Upload New Video
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadIcon />}
          sx={{ backgroundColor: '#FF1493' }}
          disabled={uploading}
        >
          {uploading ? <CircularProgress size={24} /> : 'Upload Video'}
          <input
            type="file"
            hidden
            accept="video/*"
            onChange={handleVideoUpload}
          />
        </Button>
      </Paper>

      {/* Videos List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Videos
        </Typography>
        <List>
          {videos.map((video) => (
            <ListItem key={video.id}>
              <ListItemText
                primary={video.title}
                secondary={`Uploaded: ${new Date(video.uploadDate).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleShare(video.id)}
                  sx={{ color: '#FF1493', mr: 1 }}
                >
                  <ShareIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(video.id)}
                  sx={{ color: '#FF1493' }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Share Link Dialog */}
      {shareLink && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Share Link
          </Typography>
          <TextField
            fullWidth
            value={shareLink}
            variant="outlined"
            InputProps={{
              readOnly: true,
            }}
          />
          <Button
            variant="contained"
            onClick={() => navigator.clipboard.writeText(shareLink)}
            sx={{ mt: 2, backgroundColor: '#FF1493' }}
          >
            Copy Link
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default InstructorDashboard; 