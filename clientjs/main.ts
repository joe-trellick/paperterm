console.log("main.ts is loaded")

import WebSocket from 'isomorphic-ws'
import { parse } from 'uuid'

var inputField: HTMLInputElement
var historyDiv: HTMLDivElement
var pinbarDiv: HTMLDivElement

const collapseLabel: string = 'collapse'
const expandLabel: string = 'expand'

// Wait for DOM and then attach handlers
document.addEventListener("DOMContentLoaded", () => {
    setupDOMElements()
    loadState()
})

function setupDOMElements() {
    // Add return key support for input
    inputField = document.getElementById("command") as HTMLInputElement
    inputField.addEventListener("keyup", ({key}) => {
        if (key === "Enter") {
            sendCurrentInput()
        }
    })

    historyDiv = document.getElementById("history") as HTMLDivElement
    pinbarDiv = document.getElementById("pinbar") as HTMLDivElement
}

function loadState() {
    fetch('/state')
    .then(response => response.json())
    .then(data => {
        let historyItems = data.history
        historyItems.forEach((element: any) => {
            addCommandToHistory(element, "end")
        })
    })
}

function sendCurrentInput() {
    let input: string = inputField.value
    inputField.value = ''
    sendCommandByWebSocket(input)
}
// Put into global scope for onclick handler in HTML, Webpack requires this
// You can extend the Window type to do this more cleanly:
// https://stackoverflow.com/questions/12709074/how-do-you-explicitly-set-a-new-property-on-window-in-typescript
(window as any).sendCurrentInput = sendCurrentInput

var ws: WebSocket
var pendingCommands: string[] = new Array()
function sendCommandByWebSocket(input: string) {
    pendingCommands.push(JSON.stringify({action: "start", command: input}))

    if (!ws) {
        ws = new WebSocket('ws://localhost:3000')
    }

    if (ws.readyState === WebSocket.OPEN) {
        while (pendingCommands.length > 0) {
            let command = pendingCommands.shift()
            ws.send(command)
        }
    }

    ws.onmessage = function message(event: WebSocket.MessageEvent) {
        if (event.data) {
            var parsedMessage
            try {
                parsedMessage = JSON.parse(event.data.toString())
            } catch (error) {
                console.log("Received unknown message", event.data)
            }
            if (parsedMessage.command) {
                console.log(`Response: ${JSON.stringify(parsedMessage)}`)
                switch (parsedMessage.status) {
                    case "start":
                        addCommandToHistory(parsedMessage, "start")
                        break
                    
                    case "continue":
                        continueCommand(parsedMessage)
                        break

                    case "end":
                        endCommand(parsedMessage)
                        break

                    default:
                        console.log("Unknown status", parsedMessage.status)
                }
            }    
        }
    }

    ws.onopen = function open() {
        console.log('Websocket connected')
        while (pendingCommands.length > 0) {
            let command = pendingCommands.shift()
            ws.send(command)
        }
    }
}

function isHistoryEntryCollapsed(entryDiv: HTMLDivElement) {
    let outputDiv = outputDivForHistoryEntry(entryDiv)
    return outputDiv.style.display == 'none'
}

function outputDivForHistoryEntry(entryDiv: HTMLDivElement) {
    return entryDiv.querySelector('.historyOutput') as HTMLDivElement
}
function outputPreForHistoryEntry(entryDiv: HTMLDivElement) {
    return entryDiv.querySelector('.historyOutputPre') as HTMLPreElement
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
        inputField.value = commandText
        sendCommandByWebSocket(commandText)
    }
}

function findHistoryDivForHistoryId(historyId: string): HTMLDivElement | undefined {
    const div = historyDiv.querySelector(`[data-history-id="${historyId}"]`) as HTMLDivElement
    return div
}

function findPinbarDivForHistoryId(historyId: string): HTMLDivElement | undefined {
    const div = pinbarDiv.querySelector(`[data-history-id="${historyId}"]`) as HTMLDivElement
    return div
}

function continueCommand(response: any) {
    let historyId = response.historyId
    let historyEntryDiv = findHistoryDivForHistoryId(historyId)
    if (historyEntryDiv) {
        appendOutputToEntryDiv(historyEntryDiv, response.output)
    }
    let pinbarEntryDiv = findPinbarDivForHistoryId(historyId)
    if (pinbarEntryDiv) {
        appendOutputToEntryDiv(pinbarEntryDiv, response.output)
    }
}

function appendOutputToEntryDiv(entryDiv: HTMLDivElement, continuedOutput: string) {
    let outputPre = outputPreForHistoryEntry(entryDiv)
    if (outputPre) {
        outputPre.textContent = outputPre.textContent + continuedOutput
        let hasOutput = outputPre.textContent.length > 0
        // Make sure to scroll to show added stuff
        // TODO: Make this more nuanced to not do this if the user has scrolled back up?
        let outputDiv = outputDivForHistoryEntry(entryDiv)
        if (outputDiv) {
            if (hasOutput) {
                outputDiv.style.display = "block"
            }
            outputDiv.scrollTop = outputDiv.scrollHeight
        }
        let historyEntryCollapseButton = entryDiv.querySelector('.historyEntryCollapseButton') as HTMLDivElement
        if (historyEntryCollapseButton && hasOutput) {
            historyEntryCollapseButton.style.display = "block"
        }
    }
}

function endCommand(response: any) {
    let historyId = response.historyId
    let historyEntryDiv = findHistoryDivForHistoryId(historyId)
    if (historyEntryDiv) {
        updateHistoryEntryOnCommandEnd(historyEntryDiv)
    }
    let pinbarEntryDiv = findPinbarDivForHistoryId(historyId)
    if (pinbarEntryDiv) {
        updateHistoryEntryOnCommandEnd(pinbarEntryDiv)
    }
}

function updateHistoryEntryOnCommandEnd(entryDiv: HTMLDivElement) {
    entryDiv.dataset.running = "False"
    let buttonDiv = entryDiv.querySelector('.historyEntryStopButton') as HTMLDivElement
    if (buttonDiv) {
        buttonDiv.style.display = "none"
    }
}

function stopHistoryEntry(entryDiv: HTMLDivElement) {
    // TODO: Deal with multiple simultaneous commands
    if (ws) {
        let body = JSON.stringify({action: "stop", historyId: entryDiv.dataset.historyId})
        ws.send(body)
    }
}

function addCommandToHistory(response: any, status: string) {
    let running = (status == "start" || status == "continue")
    let output = response.output
    let hideOutput = output.length == 0
    let historyEntryDiv: HTMLDivElement = document.createElement("div")
    historyEntryDiv.className = "historyEntry"
    historyEntryDiv.dataset.running = running ? "True" : "False"
    if (response.historyId) {
        historyEntryDiv.dataset.historyId = response.historyId
    }

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
    if (hideOutput) {
        historyEntryCollapseButton.style.display = "none"
    }
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

    let stopButton: HTMLDivElement = document.createElement("div")
    stopButton.className = "historyEntryStopButton"
    stopButton.textContent = "stop"
    if (!running) {
        stopButton.style.display = "none"
    }
    stopButton.addEventListener("click", () => {
        let historyEntry = historyEntryPinButton.closest('.historyEntry') as HTMLDivElement
        if (historyEntry) {
            stopHistoryEntry(historyEntry)
        }
    })

    let historyEntryOutput: HTMLDivElement = document.createElement("div")
    historyEntryOutput.className = "historyOutput"
    if (hideOutput) {
        historyEntryOutput.style.display = "none"
    }

    let historyEntryOutputPre: HTMLPreElement = document.createElement("pre")
    historyEntryOutputPre.className = "historyOutputPre"
    historyEntryOutputPre.textContent = response.output

    historyEntryDiv.appendChild(historyEntryTitlebarDiv)
    historyEntryTitlebarDiv.appendChild(historyEntryTitle)
    historyEntryTitlebarDiv.appendChild(historyEntryButtons)
    historyEntryButtons.appendChild(stopButton)
    historyEntryButtons.appendChild(historyEntryCollapseButton)
    historyEntryButtons.appendChild(historyEntryRerunButton)
    historyEntryButtons.appendChild(historyEntryPinButton)
    historyEntryButtons.appendChild(historyEntryTrashButton)
    historyEntryDiv.appendChild(historyEntryOutput)
    historyEntryOutput.appendChild(historyEntryOutputPre)

    let previousEntry = historyDiv.children[0] as HTMLDivElement
    if (previousEntry) {
        setHistoryEntryCollapsed(previousEntry, true)
    }
    historyDiv.insertBefore(historyEntryDiv, previousEntry)
}