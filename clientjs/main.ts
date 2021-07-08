console.log("main.ts is loaded");

var inputField: HTMLInputElement;
var outputField: HTMLTextAreaElement;
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

    outputField = document.getElementById("output") as HTMLTextAreaElement
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
        outputField.value = data.output
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

    let historyEntryTitle: HTMLParagraphElement = document.createElement("p")
    historyEntryTitle.textContent = `% ${response.command}`

    let historyEntryOutput: HTMLPreElement = document.createElement("pre")
    historyEntryOutput.textContent = response.output

    historyEntryDiv.appendChild(historyEntryTitle)
    historyEntryDiv.appendChild(historyEntryOutput)
    historyDiv.insertBefore(historyEntryDiv, historyDiv.children[0])
}