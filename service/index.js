const http = require('http');
const os = require('os');
const disk = require('diskusage');
const { exec } = require('child_process');



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

async function getDiskInfo() {
    const diskInfo = await disk.check('/')
    return (diskInfo.available / 1000000).toFixed(0)
}

function getUptime() {
    const uptime = os.uptime()
    return uptime
}

async function getRunningProcesses() {

    return new Promise((resolve, reject) => {
        exec('ps -eo comm', (err, stdout, stderr) => {
            if (err) {
                reject(err)
            }
            if (stderr) {
                reject(stderr)
            }
            const processes = stdout.split('\n').filter((name) => name !== '').filter((name) => name.trim())
            resolve(processes)
        })
    })
}

async function getService1Data(){
    const details = {}
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

async function getService2Data(){
    return new Promise((resolve, reject) => {
        http.get('http://service2:8299', (response) => {
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


const requestHandler = async (request, response) => {
    if (request.url === '/') {
        const service1Data = await getService1Data()
        const service2Data = await getService2Data()
        const responseBody = [{ "Service 1" : service1Data}, { "Service 2" : service2Data}]
        
                
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