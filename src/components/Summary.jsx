import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Container, Grid, CircularProgress } from '@mui/material';
import Slider from 'react-slick';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const TechniqueStatCard = ({ technique, accuracy, change }) => {
  const Icon = change > 0 ? ArrowUpward : change < 0 ? ArrowDownward : null;
  const iconColor = change > 0 ? 'green' : 'red';

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1">{technique}</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" fontWeight="bold">{accuracy}%</Typography>
          {Icon && <Icon fontSize="small" sx={{ color: iconColor }} />}
        </Box>
      </Grid>
      <LinearProgress 
        variant="determinate" 
        value={accuracy}
        sx={{ height: 10, borderRadius: 5, backgroundColor: '#ffe0f0', '& .MuiLinearProgress-bar': { backgroundColor: '#FF1493' } }}
      />
    </Box>
  );
};

const Stats = () => {
  const sessionData = [
    {
      sessionName: "Session 1 - March 20",
      techniques: [
        { technique: "Arabesque", accuracy: 92, change: +2 },
        { technique: "Pirouette", accuracy: 88, change: -1 },
        { technique: "Jeté", accuracy: 85, change: 0 },
      ],
    },
    {
      sessionName: "Session 2 - March 21",
      techniques: [
        { technique: "Battement", accuracy: 90, change: +1 },
        { technique: "Plié", accuracy: 93, change: +3 },
        { technique: "Chassé", accuracy: 87, change: -2 },
      ],
    },
  ];

  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    const generateSummaries = async () => {
      for (const session of sessionData) {
        const prompt = `Write a short 2-3 sentence summary of a ballet session performance titled "${session.sessionName}". The dancer had these technique scores:\n` +
          session.techniques.map(t => `${t.technique}: ${t.accuracy}%`).join('\n');

        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` // Use environment variable!
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.5,
            })
          });

          const data = await response.json();
          const summaryText = data.choices[0]?.message?.content;

          setSummaries(prev => ({ ...prev, [session.sessionName]: summaryText }));
        } catch (err) {
          console.error("Failed to generate summary:", err);
          setSummaries(prev => ({ ...prev, [session.sessionName]: "Summary unavailable." }));
        }
      }
    };

    generateSummaries();
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center', color: '#FF1493' }}>
        Technique Accuracy Per Session
      </Typography>

      <Slider {...sliderSettings}>
        {sessionData.map((session, idx) => (
          <Card key={idx} sx={{ p: 3, mx: 2, boxShadow: 3, borderRadius: '16px' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#444' }}>
                {session.sessionName}
              </Typography>

              {session.techniques.map((tech, i) => (
                <TechniqueStatCard key={i} {...tech} />
              ))}

              <Box mt={3} sx={{ background: '#fdf2f8', p: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontStyle="italic">
                  {summaries[session.sessionName] || <CircularProgress size={20} />}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Slider>
    </Container>
  );
};

export default Stats;
