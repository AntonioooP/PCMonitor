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
	try {
		const [cpuLoad, cpuTemp, gpuInfo, mem, uptime] = await Promise.all([si.currentLoad(), si.cpuTemperature(), si.graphics(), si.mem(), Promise.resolve(os.uptime())])
		const cpuUsage = cpuLoad.currentLoad.toFixed(2) + '%'
		const cpuTemperature = cpuTemp.main !== null ? cpuTemp.main + '°C' : 'N/A'
		console.log(cpuTemp)
		const gpu = gpuInfo.controllers[ 0 ] || {}
		const gpuUsage = (gpu.utilizationGpu || 0) + '%'
		const gpuTemp = (gpu.temperatureGpu || 0) + '°C'
		const ramUsage = ((mem.active / mem.total) * 100).toFixed(0) + '%'

		const powerUsage = '100w' // Placeholder 
		const uptimeHours = (uptime / 3600).toFixed(2) + 'h'

		return {
			cpu: {
				usage: cpuUsage,
				temp: cpuTemperature
			},
			gpu: {
				usage: gpuUsage,
				temp: gpuTemp
			},
			ramUsage: ramUsage,
			powerUsage: powerUsage,
			uptime: uptimeHours
		}
	} catch (error) {
		console.error('Error fetching system metrics:', error)
		return null
	}
}