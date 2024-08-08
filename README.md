# PC Monitor
The goal of this project is to have an easy way to interact with other computers on the same network. 
Features: (WIP)
- Command execution
- File transfer (Upload and execution)
- Screenshot
- System information (CPU, GPU, RAM, Power, etc.)

## Requirements:
- Windows OS
- NodeJS v20.11.1 or higher (haven't tested for lower versions, but to keep it safe)
- GCC and PDH library for CPU and GPU usage monitoring
- [SpeedFan](https://www.almico.com/speedfan.php) to get CPU temps. Make sure it's installed on C:\Program Files (x86)\SpeedFan, and is currently running and has a log file created for the current day.

To run the program:
- Go into the Server directory and run `node index.js` to start the server on port 3000. This port has a dashboard where the features listed can be used. If no clients are connected, the dashboard will be empty.
- Go into the Client directory and compile the metrics CPP program by using `g++ -O3 -march=native metrics.cpp -o metrics -lpdh` if the program is not already compiled/isn't working, as I have not had the time to test in multiple systems. 
- Go into the Client directory and run `node index.js` to start the WS client, which will connect to the server on port 3000. 
- Refresh the website if necessary to view the connected client(s). 