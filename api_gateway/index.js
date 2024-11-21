const express = require("express");
const bodyParser = require("body-parser");
const Logger = require("./logger.js");
const http = require('http');
require('dotenv').config();

const SERVICE1_URL = process.env.SERVICE1_URL // Defined in docker-compose.yml
const CONTROLLER_URL = process.env.CONTROLLER_URL // Defined in docker-compose.yml

const app = express();
const port = 80; 

const logger = new Logger();

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

async function getService1Data(){
    return new Promise((resolve, reject) => {
        http.get(SERVICE1_URL, (response) => {
            let data = '';
            const statusCode = response.statusCode;

            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                if (statusCode !== 200) {
                    reject({
                        statusCode: statusCode,
                        message: data
                    });
                }
                else {
                    resolve(JSON.parse(data));
                }
            });

        }).on("error", (err) => {
            resolve("Error fetching data from service 1")
        });
    })
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

    logger.log(`${state} -> ${newState}`);
    state = newState; // Update the state

    if (state === State.SHUTDOWN) {
        // Call control server to stop all containers
        http.request(`${CONTROLLER_URL}/stop`, { method: 'POST' }).end();
    }
    
    res.status(200).send(`${state}\n`);
});

// GET /state
app.get("/state", (req, res) => {
    res.status(200).send(`${state}\n`);
});

// GET /request
app.get("/request", async (req, res) => {
    if (state === State.PAUSED || state === State.INIT)     {
        res.status(400).send("Invalid state for processing /request .\n");
        return;
    }

    // Call service 1
    try {
        const data = await getService1Data();
        res.status(200).send(`${JSON.stringify(data, null, 2)}\n`);
    }
    catch (err) {
        res.status(err.statusCode || 500).send(`${err.message || 'Internal Server Error'}\n`);

    }

});

// GET /run-log
app.get("/run-log", (req, res) => {

    if (state === State.PAUSED || state === State.INIT) {
        res.status(400).send("Invalid state for processing /run-log .\n");
        return;
    }

    const logs = logger.getLogs().join("\n");
    res.status(200).send(`${logs}\n`);
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
