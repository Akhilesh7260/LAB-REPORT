const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// GET / - Welcome route
app.get('/', (req, res) => {
  res.status(200).send('Welcome to my Lab 1 Node.js and Express server!');
});

// GET /about - Return name and section as JSON
app.get('/about', (req, res) => {
  res.status(200).json({
    name: 'DEVA AKHILESH',
    registrationNumber: '252U1R9030',
    section: 'CSE-2A-304'
  });
});

// GET /time - Return the current date and time
app.get('/time', (req, res) => {
  res.status(200).json({
    currentDateTime: new Date()
  });
});

// 404 handler for unknown paths
app.use((req, res) => {
  res.status(404).send('404 - Page not found');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
