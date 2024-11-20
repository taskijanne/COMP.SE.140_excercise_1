const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 80; // Port for the API Gateway

// Middleware to parse text/plain bodies
app.use(bodyParser.text({ type: "text/plain" }));

app.use((req, res, next) => {
    res.type('text/plain'); // Default Content-Type
    next();
});

// In-memory state
let state = "INIT"; // Default state

const State = {
    INIT: "INIT",
    PAUSED: "PAUSED",
    RUNNING: "RUNNING",
    SHUTDOWN: "SHUTDOWN",

};


const validStateTransitions = [
    [State.INIT, State.RUNNING],
    [State.RUNNING, State.PAUSED],
    [State.RUNNING, State.SHUTDOWN],
    [State.PAUSED, State.RUNNING],
    [State.PAUSED, State.SHUTDOWN],
]

const isValidStateTransition = (fromState, toState) => {
    return validStateTransitions.some(([from, to]) => from === fromState && to === toState);
}

// PUT /state
app.put("/state", (req, res) => {
    console.log(req.body)
    const newState = req.body;

    if (!Object.values(State).includes(newState)) {
        res.status(400).send("Invalid state. Use INIT, PAUSED, RUNNING, or SHUTDOWN.\n");
        return;
    }

    if (!isValidStateTransition(state, newState)) {
        res.status(400).send(`Invalid state transition from ${state} to ${newState}\n`);
        return;
    }

    state = newState; // Update the state
    res.status(200).send(`${state}`);
});

// GET /state
app.get("/state", (req, res) => {
    res.status(200).send(state);
});

// GET /request
app.get("/request", (req, res) => {
    console.log(req.headers)
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
