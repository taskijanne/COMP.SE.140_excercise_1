from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import netifaces
import subprocess
import os

# Get ip addresses for each network adapter
def getNetworkInterfaces():
    interfaces = netifaces.interfaces()
    data = {}

    for interface in interfaces:
        addresses = netifaces.ifaddresses(interface)
        ipv4 = addresses.get(netifaces.AF_INET)
        if ipv4:
            for addr in ipv4:
                data.update({interface: addr['addr']})

    return data

# Get the amount of available disk space in MB    
def getDiskInfo():
    statvfs = os.statvfs('/')
    available_space_bytes = statvfs.f_frsize * statvfs.f_bavail
    available_space_mb = available_space_bytes / (1024 * 1024)
    return round(available_space_mb)

# Get system uptime in seconds    
def getUptime():
    uptime_output = subprocess.run(['cat', '/proc/uptime'], capture_output=True, text=True)
    if uptime_output.returncode == 0:
        uptime_seconds = float(uptime_output.stdout.split()[0])
        return uptime_seconds
    else:
        return None

# Get a list of running processes
def getRunningProcesses():
    result = subprocess.run(['ps', '-eo', 'comm'], capture_output=True, text=True)

    if result.returncode == 0:
        process_list = result.stdout.strip().split('\n')
        process_list = process_list[1:]       
        return process_list
    else:
        return None

# Gather data from service 2 (this service)
def getService2Data():
    networkInterfaces = getNetworkInterfaces()
    processes = getRunningProcesses()
    diskInfo = getDiskInfo()
    uptime = getUptime()
    return {
        "networkInterfaces": networkInterfaces,
        "processes": processes,
        "availableDiskSpaceInMegaBytes": diskInfo,
        "systemUptimeInSeconds": uptime
    }


class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    
    # Called when Service 1 requests data from Service 2
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            try:
                self.resultJson = getService2Data()
                self.wfile.write(bytes(json.dumps(self.resultJson), "utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(bytes(json.dumps({"error": str(e)}), "utf-8"))
            
        else:
            self.send_response(404)
            self.end_headers()

# Starts an HTTP server. This server will listen on port 8299
# but will not be exposed outside of the docker compose network
def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler):
    server_address = ('', 8299)
    print("Service started")
    httpd = server_class(server_address, handler_class)
    httpd.serve_forever()

if __name__ == '__main__':
    run()
    
