const http = require('http');
const os = require('os');
const disk = require('diskusage');
const { exec } = require('child_process');
require('dotenv').config();

const service2Url = process.env.SERVICE2_URL
const port = 8199

// Get ip addresses for each network adapter
function getNetworkInterfaces() {
    const network = os.networkInterfaces();
    const networkInterfaceNames = Object.keys(network)
    const networkInterfaceData = {}

    networkInterfaceNames.forEach((networkInterfaceName) => {
        const networkInterface = network[networkInterfaceName]
        const networkInterfaceDetails = networkInterface[0]
        const address = networkInterfaceDetails.address
        networkInterfaceData[`${networkInterfaceName}`] = address
    })

    return networkInterfaceData
}

// Get available disk space in MB
async function getDiskInfo() {
    const diskInfo = await disk.check('/')
    return parseInt((diskInfo.available / (1024 * 1024)).toFixed(0))
}

// Get system uptime in seconds
function getUptime() {
    const uptime = os.uptime()
    return uptime
}

// Get a list of running processes
async function getRunningProcesses() {

    return new Promise((resolve, reject) => {
        exec('ps -eo comm', (err, stdout, stderr) => {
            if (err) {
                reject(err)
            }
            if (stderr) {
                reject(stderr)
            }
            const processes = stdout.split('\n').slice(1).filter((name) => name !== '').filter((name) => name.trim())
            resolve(processes)
        })
    })
}

// Gather data from service 1 (this service)
async function getService1Data(){
    const networkInterfaces = getNetworkInterfaces()
    const processes = await getRunningProcesses()
    const diskInfo = await getDiskInfo()
    const uptime = getUptime()

    data = {
        "networkInterfaces": networkInterfaces,
        "processes": processes,
        "availableDiskSpaceInMegaBytes": diskInfo,
        "systemUptimeInSeconds": uptime
    }

    return data
}

// Gather data from service 2
// Creates an HTTP request to service 2 and returns the data
async function getService2Data(){
    console.log(`Fetching data from service 2 at ${service2Url}`)
    return new Promise((resolve, reject) => {
        http.get(service2Url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                resolve(JSON.parse(data)); 
            });
        }).on("error", (err) => {
            resolve("Error fetching data from service 2")
        });
    })

}

// Handles HTTP requests to the service
const requestHandler = async (request, response) => {
    if (request.url === '/') {
        console.log('Request received');
        const service1Data = await getService1Data()
        const service2Data = await getService2Data()
        const responseBody = [{ "Service 1" : service1Data}, { "Service 2" : service2Data}]
        
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(responseBody, null, 2));
    } else {
        response.end('Invalid endpoint');
    }
};

const server = http.createServer(requestHandler);

server.listen(port, () => {
    console.log(`Service started with HTTP server in port ${port}`);
});