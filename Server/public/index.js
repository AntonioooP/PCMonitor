function createTd(text, button, listener, colSpan) {
	const cell = document.createElement('td')
	if (colSpan) cell.colSpan = colSpan
	button ? (cell.innerHTML = `<button>${text}</button>`) : (cell.innerText = text)
	if (typeof listener === 'function') cell.addEventListener('click', listener)
	return cell
}

function populateTable(data) {
	const table = document.getElementById('clients')
	const tableBody = table.getElementsByTagName('tbody')[0]
	tableBody.innerHTML = ''
	if (!data.length) {
		const row = document.createElement('tr')
		// 12 Column spans to center the text
		row.appendChild(createTd('No data available. Please connect to a client and click the refresh button.', false, null, 12))
		return tableBody.appendChild(row)
	}
	data.forEach((item) => {
		const row = document.createElement('tr')
		row.appendChild(createTd(item.clientId))

		const actions = ['Run Command', 'Upload file', 'Open file', 'View Screen']
		actions.forEach((action) => {
			if (action == 'View Screen') return row.appendChild(createTd(action, true, () => getScreenshot(item.clientId)))
			else if (action == 'Run Command') return row.appendChild(createTd(action, true, () => showCLI(item.clientId)))
			else if (action == 'Upload file') return row.appendChild(createTd(action, true, () => uploadFile(item.clientId)))

			row.appendChild(createTd(action, true, () => true))
		})

		const metrics = [item.cpu.usage, item.cpu.temp, item.gpu.usage, item.gpu.temp, item.ramUsage, item.powerUsage, item.uptime]
		metrics.forEach((metric) => row.appendChild(createTd(metric)))

		tableBody.appendChild(row)
	})
}
fetch('/clients')
	.then((res) => res.json())
	.then((res) => populateTable(res))

document.getElementById('close').addEventListener('click', () => document.getElementById('ss-container').classList.add('hidden'))
document.getElementById('close-cli').addEventListener('click', () => document.getElementById('cli').classList.add('hidden'))
document.getElementById('refresh').addEventListener('click', () =>
	fetch('/clients')
		.then((res) => res.json())
		.then((res) => populateTable(res))
)

function getScreenshot(clientId) {
	setMessage('Fetching Screenshot...')
	fetch('/screenshot', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({clientId})
	})
		.then((res) => res.json())
		.then((screenshotData) => {
			const img = document.getElementById('ss-img')
			img.src = `data:image/png;base64,${screenshotData.buffer}`
			document.getElementById('ss-container').classList.remove('hidden')
		})
		.catch((error) => setMessage(error.message, true))
}

function uploadFile(clientId) {
	const fileInput = document.getElementById('fileInput')
	fileInput.click()
	fileInput.onchange = () => {
		const file = fileInput.files[0]

		if (!file) return console.log('no file')

		const form = new FormData()
		form.append('file', file)
		form.append('clientId', clientId)
		fetch('/upload', {
			method: 'POST',
			body: form
		})
			.then((response) => response.json())
			.then(() => setMessage('Uploaded File'))
			.catch((error) => setMessage(error.message, true))
	}
}

function setMessage(content, error) {
	const messageDiv = document.getElementById('message')
	messageDiv.classList.remove('error')
	messageDiv.textContent = content

	if (error) messageDiv.classList.add('error')
	messageDiv.classList.remove('hidden')
	
	setTimeout(() => messageDiv.classList.add('hidden'), 5000)
}

function showCLI(clientId) {
	const cliInput = document.getElementById('cli-input')
	const outputDiv = document.getElementById('output')
	const cliPrefix = document.getElementById('cli-prefix')

	document.getElementById('cli').classList.remove('hidden')
	cliPrefix.textContent = `${clientId}> `

	cliInput.addEventListener('keydown', async (event) => {
		if (event.key === 'Enter') {
			const command = cliInput.value.trim()
			if (command == 'cls' || command == 'clear') {
				outputDiv.innerHTML = ''
				cliInput.value = ''
				return
			}
			if (command !== '') {
				displayCommand(command)
				await sendCommand(command)
				cliInput.value = ''
			}
		}
	})

	function displayCommand(command) {
		const commandLine = document.createElement('div')
		commandLine.textContent = `${cliPrefix.textContent} ${command}`
		outputDiv.appendChild(commandLine)
		outputDiv.scrollTop = outputDiv.scrollHeight
		scrollToBottom()
	}

	async function sendCommand(command) {
		try {
			const response = await fetch('/command', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({command, clientId})
			})
			const data = await response.json()
			if (data.stderr) displayOutput(data.stderr)
			else displayOutput(data.stdout)
		} catch (error) {
			displayOutput('Error: Unable to send command')
		}
	}

	function displayOutput(output) {
		const formattedOutput = output.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r\n/g, '<br>')
		const outputLine = document.createElement('div')
		outputLine.innerHTML = formattedOutput
		outputDiv.appendChild(outputLine)
		scrollToBottom()
	}
	function scrollToBottom() {
		const cli = document.getElementById('cli-container')
		cli.scrollTop = cli.scrollHeight
	}
}
