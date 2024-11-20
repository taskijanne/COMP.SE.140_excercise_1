const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 80; // Port for the API Gateway

// Middleware to parse text/plain bodies
app.use(bodyParser.text({ type: "text/plain" }));

// In-memory state
let state = "INIT"; // Default state

// PUT /state
app.put("/state", (req, res) => {
    const validStates = ["INIT", "PAUSED", "RUNNING", "SHUTDOWN"];
    const newState = req.body;

    if (!validStates.includes(newState)) {
        res.status(400).send("Invalid state. Use INIT, PAUSED, RUNNING, or SHUTDOWN.");
        return;
    }

    state = newState; // Update the state
    res.status(200).send(`State updated to ${state}`);
});

// GET /state
app.get("/state", (req, res) => {
    res.status(200).send(state);
});

// GET /request
app.get("/request", (req, res) => {
    res.status(200).send("Request endpoint hit.");
});

// GET /run-log
app.get("/run-log", (req, res) => {
    res.status(200).send("Run log retrieved.");
});

// Catch-all for undefined routes
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).send("404 Not Found");
});

// Start the server
app.listen(port, () => {
    console.log(`API Gateway running at http://localhost:${port}`);
});
