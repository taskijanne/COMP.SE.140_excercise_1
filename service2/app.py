from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import netifaces
import subprocess
import os



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
    

def getDiskInfo():
    # Get filesystem status
    statvfs = os.statvfs('/')

    # Available space in bytes (block size * number of available blocks)
    available_space_bytes = statvfs.f_frsize * statvfs.f_bavail

    # Convert available space to megabytes
    available_space_mb = available_space_bytes / (1024 * 1024)

    return round(available_space_mb)
    

def getUptime():
    uptime_output = subprocess.run(['cat', '/proc/uptime'], capture_output=True, text=True)
    if uptime_output.returncode == 0:
        uptime_seconds = float(uptime_output.stdout.split()[0])
        return uptime_seconds
    else:
        print(f"Error: {uptime_output.stderr}")
        return None

def getRunningProcesses():
    result = subprocess.run(['ps', '-eo', 'comm'], capture_output=True, text=True)

    # Check if the command was successful
    if result.returncode == 0:
        process_list = result.stdout.strip().split('\n')

        process_list = process_list[1:]
        
        return process_list
        
    else:
        print(f"Error: {result.stderr}")
        return None

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            
            self.networkInterfaces = getNetworkInterfaces()
            self.processes = getRunningProcesses()
            self.diskInfo = getDiskInfo()
            self.uptime = getUptime()

            self.resultJson = {
                "networkInterfaces": self.networkInterfaces,
                "processes": self.processes,
                "availableDiskSpaceInMegaBytes": self.diskInfo,
                "systemUptimeInSeconds": self.uptime
            }

            self.wfile.write(bytes(json.dumps(self.resultJson), "utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler):
    server_address = ('', 8299)  # Listen on port 8299
    httpd = server_class(server_address, handler_class)
    print("Starting http server on port 8299...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
    
