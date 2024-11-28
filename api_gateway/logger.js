// Simple logger class to log messages

class Logger{
    constructor(){
        this.logs = [];
    }

    log(log){
        const timestamp = new Date().toISOString();
        this.logs.push(`${timestamp}: ${log}`);
    }

    getLogs(){
        return this.logs;
    }
}

module.exports = Logger;