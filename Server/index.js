const express = require('express')
const WebSocket = require('ws')
const http = require('http')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server})

let clients = {}

app.use(express.json())
app.use(express.static('public'))

// Endpoint to send commands
app.post('/command', (req, res) => {
	const {clientId, command} = req.body
	if (clients[clientId]) {
		clients[clientId].send(JSON.stringify({type: 'command', command}))
		res.send('Command sent')
	} else {
		res.status(404).send('Client not found')
	}
})

app.get('/clients', async (req, res) => {
	const promises = Object.keys(clients).map(
		(id) =>
			new Promise((resolve, reject) =>
				clients[id].send(JSON.stringify({type: 'metrics'}), (error) => {
					if (error) return reject(error)

					clients[id].once('message', (message) => {
						try {
							const metrics = JSON.parse(message).metrics
							metrics.clientId = id
							resolve(metrics)
						} catch (err) {
							reject(err)
						}
					})
				})
			)
	)

	try {
		const data = await Promise.all(promises)
		console.log(data)
		res.send(data)
	} catch (error) {
		res.status(500).send(error.message)
	}
})
// WebSocket connection
wss.on('connection', (ws, req) => {
	const clientId = req.headers['sec-websocket-key']
	clients[clientId] = ws
	console.log('Client connected. Client ID:', clientId)
	ws.on('message', (message) => {
		const data = JSON.parse(message)
		console.log(`Received from ${clientId}:`, data)

		if (data.type === 'status') {
		} else if (data.type === 'screenshot') {
		}
	})

	ws.on('close', () => delete clients[clientId])
})

server.listen(3000, () => console.log('Server started on port 3000'))
