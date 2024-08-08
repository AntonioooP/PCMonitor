const WebSocket = require('ws')
const {exec} = require('child_process')
const screenshot = require('screenshot-desktop')
const fs = require('fs')
const path = require('path')
let ws, metrics = {}
getMetrics()

function connect() {
	ws = new WebSocket('ws://localhost:3000')

	ws.on('open', () => console.log('Connected to server'))

	ws.on('close', () => {
		console.log('Disconnected from server. Attempting to reconnect...')
		setTimeout(connect, 5000)
	})

	ws.on('error', (error) => {
		console.error('WebSocket error:', error)
		ws.close()
	})

	ws.on('message', async (message) => {
		const data = JSON.parse(message)
		const requestId = data.requestId
		if (data.type === 'command') exec(data.data, (error, stdout, stderr) => ws.send(JSON.stringify({type: 'result', stdout, stderr, requestId})))
		else if (data.type === 'screenshot') {
			await screenshot({ filename: 'ss.jpg' })
			const buffer = fs.readFileSync('./ss.jpg', { encoding: 'base64' })
			ws.send(JSON.stringify({ type: 'screenshot', buffer, requestId}))
		} else if (data.type === 'metrics') ws.send(JSON.stringify({type: 'metrics', metrics, requestId}))
	})
}

connect()
setInterval(getMetrics, 5000)

async function getMetrics() {
	try {
		// Using SpeedFan to get CPU temperature, as other methods using NodeJS didn't seem to work for some reason, this should be reliable with any system I guess 
		const logFilePath = path.join('C:', 'Program Files (x86)', 'SpeedFan', 'SFLog' + getCurrentDate() + '.csv')
		const command = `metrics.exe "${logFilePath}"`

		const result = await new Promise((resolve, reject) => {
			exec(command, (error, stdout, stderr) => {
				if (error) return reject(`Error: ${error.message}`)
				if (stderr) return reject(`Error: ${stderr}`)
				resolve(JSON.parse(stdout))
			})
		})
		metrics = result
	} catch (error) {
		console.error('Failed to get metrics:', error)
	}
}

// YYYYMMDD
function getCurrentDate() {
	const now = new Date()
	return now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0')
}