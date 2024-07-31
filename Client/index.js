const WebSocket = require('ws')
const {exec} = require('child_process')
const si = require('systeminformation')
const os = require('os')
const screenshot = require('screenshot-desktop')
const fs = require('fs')

const ws = new WebSocket('ws://localhost:3000')

ws.on('open', () => {
	console.log('Connected to server')
})

ws.on('message', async (message) => {
	const data = JSON.parse(message)
	const requestId = data.requestId
	if (data.type === 'command') {
		exec(data.command, (error, stdout, stderr) => {
			if (error) return ws.send(JSON.stringify({type: 'error', error: error.message}))
			ws.send(JSON.stringify({type: 'result', stdout, stderr, requestId}))
		})
	} else if (data.type === 'screenshot') {
		await screenshot({ filename: 'ss.jpg' })
		const buffer = fs.readFileSync('./ss.jpg', { encoding: 'base64' })
		ws.send(JSON.stringify({ type: 'screenshot', buffer, requestId}))
	} else if (data.type === 'metrics') {
		const metrics = await getMetrics()
		ws.send(JSON.stringify({type: 'metrics', metrics, requestId}))
	}
})

async function getMetrics() {
	try {
		const [cpuLoad, cpuTemp, gpuInfo, mem, uptime] = await Promise.all([si.currentLoad(), si.cpuTemperature(), si.graphics(), si.mem(), Promise.resolve(os.uptime())])
		const cpuUsage = cpuLoad.currentLoad.toFixed(2) + '%'
		const cpuTemperature = cpuTemp.main !== null ? cpuTemp.main + '°C' : 'N/A'
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