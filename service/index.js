// Import the http module
const http = require('http');
const os = require('os');
const disk = require('diskusage');

// Define the request handling function
const requestHandler = async (request, response) => {
    if (request.url === '/') {
        const responseBody = {}
        const network = os.networkInterfaces();
        const networkInterfaceNames = Object.keys(network)

        networkInterfaceNames.forEach((networkInterfaceName) => {
            const networkInterface = network[networkInterfaceName]
            const networkInterfaceDetails = networkInterface[0]
            const address = networkInterfaceDetails.address


            responseBody[networkInterfaceName] = {
                address,
            }
        })

        const diskInfo = await disk.check('/')
        responseBody["disk"] = diskInfo
        
        const uptime = os.uptime()
        responseBody["uptime"] = uptime

                
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(responseBody));
    } else {
        response.end('Invalid endpoint');
    }
};

// Create the server
const server = http.createServer(requestHandler);

// Start the server
server.listen(8199, () => {
    console.log('Server is listening on port 8199');
});