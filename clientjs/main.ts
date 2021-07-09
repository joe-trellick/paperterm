console.log("main.ts is loaded");

var inputField: HTMLInputElement;
var historyDiv: HTMLDivElement;

// Wait for DOM and then attach handlers
document.addEventListener("DOMContentLoaded", () => {
    setupDOMElements();
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
    historyEntryCollapseButton.textContent = "collapse"

    let historyEntryOutput: HTMLPreElement = document.createElement("pre")
    historyEntryOutput.textContent = response.output

    historyEntryDiv.appendChild(historyEntryTitlebarDiv)
    historyEntryTitlebarDiv.appendChild(historyEntryTitle)
    historyEntryTitlebarDiv.appendChild(historyEntryButtons)
    historyEntryButtons.appendChild(historyEntryCollapseButton)
    historyEntryDiv.appendChild(historyEntryOutput)
    historyDiv.insertBefore(historyEntryDiv, historyDiv.children[0])
}