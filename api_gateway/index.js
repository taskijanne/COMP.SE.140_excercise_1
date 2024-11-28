const express = require("express");
const bodyParser = require("body-parser");
const Logger = require("./logger.js");
const http = require('http');
require('dotenv').config();

const SERVICE1_URL = process.env.SERVICE1_URL // Defined in docker-compose.yml
const CONTROLLER_URL = process.env.CONTROLLER_URL // Defined in docker-compose.yml
const NGINX_URL = process.env.NGINX_URL // Defined in docker-compose.yml

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

// Possible states of the system
const State = {
    INIT: "INIT",
    PAUSED: "PAUSED",
    RUNNING: "RUNNING",
    SHUTDOWN: "SHUTDOWN",

};

// Valid state transitions
const validStateTransitions = [
    [State.INIT, State.RUNNING],
    [State.RUNNING, State.PAUSED],
    [State.RUNNING, State.SHUTDOWN],
    [State.PAUSED, State.RUNNING],
    [State.PAUSED, State.SHUTDOWN],
    [State.RUNNING, State.INIT],
    [State.PAUSED, State.INIT],
]

// State transitions that require authorization
const requiresAuthTransitions = [
    [State.INIT, State.RUNNING],
]

const isValidStateTransition = (fromState, toState) => {
    return validStateTransitions.some(([from, to]) => from === fromState && to === toState);
}

const requiresAuth = (fromState, toState) => {
    return requiresAuthTransitions.some(([from, to]) => from === fromState && to === toState);
}

// Helper function to make a GET requests by API Gateway
async function makeGetRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
        http.get(url, { headers }, (response) => {
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
                    resolve(data);
                }
            });

        }).on("error", (err) => {
            reject("Error fetching data");
        });
    })
}

app.put("/state", async (req, res) => {
    const newState = req.body;

    if (!Object.values(State).includes(newState)) {
        res.status(400).send("Invalid state. Use INIT, PAUSED, RUNNING, or SHUTDOWN.\n");
        return;
    }

    if (!isValidStateTransition(state, newState)) {
        res.status(400).send(`Invalid state transition from ${state} to ${newState}\n`);
        return;
    }

    if (requiresAuth(state, newState)) {
        // Nginx passes the basic authorization header to the API Gateway
        if (!req.headers['authorization']) {
            res.status(401).send("Authorization required\n");
            return;
        }
        else {
            try {
                // Validate the basic authorization header by making a request to Nginx
                await makeGetRequest(NGINX_URL, { 'Authorization': req.headers['authorization']});
            }
            catch (err) {
                res.status(err.statusCode || 500).send(`${"Invalid basic authorization header"}\n`);
                return;
            }
        }

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
        const data = await makeGetRequest(SERVICE1_URL);
        const jsonData = JSON.parse(data);
        res.status(200).send(`${JSON.stringify(jsonData, null, 2)}\n`);
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
