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
		exec(data.data, (error, stdout, stderr) => {
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
function getMetrics() {
	return new Promise((resolve, reject) => {
		exec('metrics.exe', (error, stdout, stderr) => {
			if (error) reject(`Error: ${error.message}`)
			if (stderr)	reject(`Error: ${stderr}`)
			resolve(JSON.parse(stdout))
		})
	})
}