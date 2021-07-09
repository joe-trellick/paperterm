console.log("main.ts is loaded");

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
            sendCommand();
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

function sendCommand() {
    let input:string = inputField.value;
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

    let historyEntryOutput: HTMLPreElement = document.createElement("pre")
    historyEntryOutput.className = "historyOutput"
    historyEntryOutput.textContent = response.output

    historyEntryDiv.appendChild(historyEntryTitlebarDiv)
    historyEntryTitlebarDiv.appendChild(historyEntryTitle)
    historyEntryTitlebarDiv.appendChild(historyEntryButtons)
    historyEntryButtons.appendChild(historyEntryCollapseButton)
    historyEntryDiv.appendChild(historyEntryOutput)

    let previousEntry = historyDiv.children[0] as HTMLDivElement
    if (previousEntry) {
        setHistoryEntryCollapsed(previousEntry, true)
    }
    historyDiv.insertBefore(historyEntryDiv, previousEntry)
}