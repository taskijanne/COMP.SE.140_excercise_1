const http = require('http');

// The path to the Docker socket file which is mapped to the docker socket file in the host machine in docker-compose.yml
const DOCKER_SOCKET_PATH = '/var/run/custom.sock';
const CONTROLLER_CONTAINER = 'compse140_excercise_1-control_service';
const TEST_CONTAINER = "compse140_excercise_1-test_service"


// Send a Docker command to the Docker socket
const sendDockerCommand = async (path, method = 'POST') => {
    return new Promise((resolve, reject) => {
        const options = {
            socketPath: DOCKER_SOCKET_PATH,
            path: path,
            method: method,
        };

        const clientRequest = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
        });

        clientRequest.on('error', (err) => reject(err));
        clientRequest.end();
    });
};


const requestHandler = async (req, res) => {
    
    // Endpoint used to kill all the containers within the docker compose network
    if (req.url === '/stop' && req.method === 'POST') {
        let thisContainerId = null;
        const response = await sendDockerCommand('/v1.41/containers/json?all=true', 'GET'); // Fetch all containers
        const containers = JSON.parse(response);

        for (const container of containers) {
            const containerId = container.Id;
            console.log(container.Image);
            if (container.Image !== CONTROLLER_CONTAINER && container.Image !== TEST_CONTAINER){ // Skip the control service container, it will be killed last
                console.log(`Killing container ${containerId}`);
                await sendDockerCommand(`/v1.41/containers/${containerId}/kill`, 'POST');
            }
            else if (container.Image === CONTROLLER_CONTAINER){
                thisContainerId = containerId;
            }
        }

        console.log(`Killing controller service container ${thisContainerId}`);
        await sendDockerCommand(`/v1.41/containers/${thisContainerId}/kill`, 'POST'); // Killing "this" container

        res.statusCode = 200;
        res.end('All containers stopped');
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
};

const server = http.createServer(requestHandler);

server.listen(5000, () => {
    console.log('Control server listening on port 5000');
});