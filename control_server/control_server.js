const http = require('http');
const { exec } = require('child_process');

const DOCKER_SOCKET_PATH = '/var/run/custom.sock';

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
    console.log(`CONTROLLER: Request URL: ${req.url}, Request Method: ${req.method}`);
    
    let thisContainerId = null;

    if (req.url === '/stop' && req.method === 'POST') {
        const response = await sendDockerCommand('/v1.41/containers/json?all=true', 'GET');
        const containers = JSON.parse(response);
        console.log(containers);

        for (const container of containers) {
            const containerId = container.Id;
            if (container.Image !== "compse140_excercise_1-control_service"){
                console.log(`Killing container ${containerId}`);
                await sendDockerCommand(`/v1.41/containers/${containerId}/kill`, 'POST');
            }
            else {
                thisContainerId = containerId;
            }
        }

        console.log(`Killing this container ${thisContainerId}`);
        await sendDockerCommand(`/v1.41/containers/${thisContainerId}/kill`, 'POST');

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