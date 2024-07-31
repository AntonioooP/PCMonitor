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
			row.appendChild(createTd(action, true, () => true))
		})

		const metrics = [item.cpu.usage, item.cpu.temp, item.gpu.usage, item.gpu.temp, item.ramUsage, item.powerUsage, item.uptime]
		metrics.forEach((metric) => row.appendChild(createTd(metric)))

		tableBody.appendChild(row)
	})
}
fetch('/clients')
	.then((res) => res.json())
	.then((res) => {
		console.log(res)
		populateTable(res)
	})

document.getElementById('close').addEventListener('click', () => 	document.getElementById('ss-container').classList.add('hidden'))