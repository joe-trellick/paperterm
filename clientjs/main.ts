console.log("main.ts is loaded");

import WebSocket from 'isomorphic-ws'

var inputField: HTMLInputElement;
var historyDiv: HTMLDivElement;

const collapseLabel: string = 'collapse'
const expandLabel: string = 'expand'

// Wait for DOM and then attach handlers
document.addEventListener("DOMContentLoaded", () => {
    setupDOMElements()
    loadState()
});

function setupDOMElements() {
    // Add return key support for input
    inputField = document.getElementById("command") as HTMLInputElement;
    inputField.addEventListener("keyup", ({key}) => {
        if (key === "Enter") {
            sendCurrentInput();
        }
    });

    historyDiv = document.getElementById("history") as HTMLDivElement
}

function loadState() {
    fetch('/state')
    .then(response => response.json())
    .then(data => {
        let historyItems = data.history
        historyItems.forEach((element: any) => {
            addCommandToHistory(element)
        });
    })
}

function sendCurrentInput() {
    let input: string = inputField.value
    inputField.value = ''
    sendCommandByWebSocket(input)
}

function sendCommand(input: string) {
    console.log(`The input is "${input}"`);
    fetch('/command', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({command: input})
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(`Response: ${JSON.stringify(data)}`)
        if (data.command) {
            addCommandToHistory(data)
        }
    })
    .catch((error) => {
        console.error('Error:', error)
    });
}

var ws: WebSocket
function sendCommandByWebSocket(input: string) {
    if (ws) {
        ws.close()
    }
    ws = new WebSocket('ws://localhost:3000')
    ws.onmessage = function message(event: WebSocket.MessageEvent) {
        if (event.data) {
            try {
                let parsedMessage = JSON.parse(event.data.toString())
                if (parsedMessage.command) {
                    console.log(`Response: ${JSON.stringify(parsedMessage)}`)
                    addCommandToHistory(parsedMessage)
                }    
            } catch (error) {
                console.log("Received unknown message", event.data)
            }
        }
    }

    ws.onopen = function open() {
        console.log('Websocket connected')
        let body = JSON.stringify({command: input})
        ws.send(body)
    }
}

function isHistoryEntryCollapsed(entryDiv: HTMLDivElement) {
    let outputDiv = outputDivForHistoryEntry(entryDiv)
    return outputDiv.style.display == 'none'
}

function outputDivForHistoryEntry(entryDiv: HTMLDivElement) {
    return entryDiv.querySelector('.historyOutput') as HTMLDivElement
}

function setHistoryEntryCollapsed(entryDiv: HTMLDivElement, collapsed: boolean) {
    let outputDiv = outputDivForHistoryEntry(entryDiv)
    if (outputDiv) {
        outputDiv.style.display = collapsed ? 'none' : 'block'
    }

    let buttonDiv = entryDiv.querySelector('.historyEntryCollapseButton')
    if (buttonDiv) {
        buttonDiv.textContent = collapsed ? expandLabel : collapseLabel
    }
}

function removeHistoryEntry(entryDiv: HTMLDivElement) {
    entryDiv.remove()
}

function pinHistoryEntry(entryDiv: HTMLDivElement) {
    let pinbarDiv = document.getElementById("pinbar") as HTMLDivElement
    let pinnedEntryDiv = entryDiv.cloneNode(true) as HTMLDivElement

    // Attach listeners
    let historyEntryCollapseButton = pinnedEntryDiv.querySelector('.historyEntryCollapseButton')
    historyEntryCollapseButton?.addEventListener("click", () => {
        let historyEntry = historyEntryCollapseButton?.closest('.historyEntry') as HTMLDivElement
        if (historyEntry) {
            setHistoryEntryCollapsed(historyEntry, !isHistoryEntryCollapsed(historyEntry))
        }
    })

    let historyEntryRerunButton = pinnedEntryDiv.querySelector('.historyEntryRerunButton')
    historyEntryRerunButton?.addEventListener("click", () => {
        let historyEntry = historyEntryRerunButton?.closest('.historyEntry') as HTMLDivElement
        if (historyEntry) {
            rerunHistoryEntry(historyEntry)
        }
    })

    let historyEntryPinButton = pinnedEntryDiv.querySelector('.historyEntryPinButton')
    if (historyEntryPinButton) {
        historyEntryPinButton.textContent = "unpin"
    }
    historyEntryPinButton?.addEventListener("click", () => {
        let historyEntry = historyEntryPinButton?.closest('.historyEntry') as HTMLDivElement
        if (historyEntry) {
            removeHistoryEntry(historyEntry)
        }
    })
    
    let historyEntryTrashButton = pinnedEntryDiv.querySelector('.historyEntryTrashButton')
    historyEntryTrashButton?.remove()

    pinbarDiv.insertBefore(pinnedEntryDiv, pinbarDiv.children[0])
}

function rerunHistoryEntry(entryDiv: HTMLDivElement) {
    let commandDiv = entryDiv.querySelector('.historyCommand')
    let commandText = commandDiv?.textContent?.substring(2)  // TODO: Use a real data representation here
    if (commandText) {
        sendCommand(commandText)
        inputField.value = commandText
    }
}

function addCommandToHistory(response: any) {
    let historyEntryDiv: HTMLDivElement = document.createElement("div")
    historyEntryDiv.className = "historyEntry"

    let historyEntryTitlebarDiv: HTMLDivElement = document.createElement("div")
    historyEntryTitlebarDiv.className = "historyEntryTitlebar"

    let historyEntryTitle: HTMLDivElement = document.createElement("div")
    historyEntryTitle.className = "historyCommand"
    historyEntryTitle.textContent = `% ${response.command}`

    let historyEntryButtons: HTMLDivElement = document.createElement("div")
    historyEntryButtons.className = "historyButtons"

    let historyEntryCollapseButton: HTMLDivElement = document.createElement("div")
    historyEntryCollapseButton.className = "historyEntryCollapseButton"
    historyEntryCollapseButton.textContent = collapseLabel
    historyEntryCollapseButton.addEventListener("click", () => {
        let historyEntry = historyEntryCollapseButton.closest('.historyEntry') as HTMLDivElement
        if (historyEntry) {
            setHistoryEntryCollapsed(historyEntry, !isHistoryEntryCollapsed(historyEntry))
        }
    })

    let historyEntryTrashButton: HTMLDivElement = document.createElement("div")
    historyEntryTrashButton.className = "historyEntryTrashButton"
    historyEntryTrashButton.textContent = "trash"
    historyEntryTrashButton.addEventListener("click", () => {
        let historyEntry = historyEntryTrashButton.closest('.historyEntry') as HTMLDivElement
        if (historyEntry) {
            removeHistoryEntry(historyEntry)
        }
    })

    let historyEntryRerunButton: HTMLDivElement = document.createElement("div")
    historyEntryRerunButton.className = "historyEntryRerunButton"
    historyEntryRerunButton.textContent = "rerun"
    historyEntryRerunButton.addEventListener("click", () => {
        let historyEntry = historyEntryTrashButton.closest('.historyEntry') as HTMLDivElement
        if (historyEntry) {
            rerunHistoryEntry(historyEntry)
        }
    })

    let historyEntryPinButton: HTMLDivElement = document.createElement("div")
    historyEntryPinButton.className = "historyEntryPinButton"
    historyEntryPinButton.textContent = "pin"
    historyEntryPinButton.addEventListener("click", () => {
        let historyEntry = historyEntryPinButton.closest('.historyEntry') as HTMLDivElement
        if (historyEntry) {
            pinHistoryEntry(historyEntry)
        }
    })

   let historyEntryOutput: HTMLPreElement = document.createElement("pre")
    historyEntryOutput.className = "historyOutput"
    historyEntryOutput.textContent = response.output

    historyEntryDiv.appendChild(historyEntryTitlebarDiv)
    historyEntryTitlebarDiv.appendChild(historyEntryTitle)
    historyEntryTitlebarDiv.appendChild(historyEntryButtons)
    historyEntryButtons.appendChild(historyEntryCollapseButton)
    historyEntryButtons.appendChild(historyEntryRerunButton)
    historyEntryButtons.appendChild(historyEntryPinButton)
    historyEntryButtons.appendChild(historyEntryTrashButton)
    historyEntryDiv.appendChild(historyEntryOutput)

    let previousEntry = historyDiv.children[0] as HTMLDivElement
    if (previousEntry) {
        setHistoryEntryCollapsed(previousEntry, true)
    }
    historyDiv.insertBefore(historyEntryDiv, previousEntry)
}