const express = require('express');
const app = express();
const port = 3000;

// Middleware for å håndtere JSON-data
app.use(express.json());

// Enkel route for hovedsiden
app.get('/', (req, res) => {
    res.send('Hei! Serveren kjører.');
});

// Start serveren
app.listen(port, () => {
    console.log(`Serveren kjører på http://localhost:${port}`);
}); 