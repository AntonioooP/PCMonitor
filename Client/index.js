const WebSocket = require('ws')
const {exec} = require('child_process')
const si = require('systeminformation')
const os = require('os')

const ws = new WebSocket('ws://localhost:3000')

ws.on('open', () => {
	console.log('Connected to server')
})

ws.on('message', async (message) => {
	const data = JSON.parse(message)
	if (data.type === 'command') {
		exec(data.command, (error, stdout, stderr) => {
			if (error) return ws.send(JSON.stringify({type: 'error', error: error.message}))
			ws.send(JSON.stringify({type: 'result', stdout, stderr}))
		})
	} else if (data.type === 'screenshot') {
	} else if (data.type === 'metrics') {
		const metrics = await getMetrics()
		console.log(metrics)
		ws.send(JSON.stringify({type: 'metrics', metrics}))
	}
})

async function getMetrics() {
	const cpuUsage = os.loadavg()[0] 
	const cpuTemp = await si.cpuTemperature()
	const gpuUsage = await si.graphics()
	const mem = await si.mem()
	const power = 0 // will get later
	const uptime = os.uptime()

	return {
		cpu: {
			usage: cpuUsage + '%',
			temp: cpuTemp.main + '°C'
		},
		gpu: {
			usage: gpuUsage.controllers[0].utilizationGpu + '%',
			temp: gpuUsage.controllers[0].temperatureGpu + '°C'
		},
		ramUsage: (mem.active / mem.total * 100).toFixed(0) + '%',
		powerUsage: power,
		uptime: (uptime / 3600).toFixed(2) + 'h'
	}
}
