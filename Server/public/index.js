function createTd(text, button, listener) {
	const cell = document.createElement('td')
	button ? (cell.innerHTML = `<button>${text}</button>`) : (cell.innerText = text)
	listener ? cell.addEventListener('click', listener) : null
	return cell
}

function populateTable(data) {
	data.forEach((item) => {
		const table = document.getElementById('clients')
		const tableBody = table.getElementsByTagName('tbody')[0]
		const row = document.createElement('tr')        
		row.appendChild(createTd(item.clientId))
        
		const actions = ['Run Command', 'Upload file', 'Execute file', 'Open file', 'View Screen']
		actions.forEach((action) => row.appendChild(createTd(action, true, () => true)))

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
