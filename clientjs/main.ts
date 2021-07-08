console.log("main.ts is loaded");

var inputField:HTMLInputElement;
var outputField:HTMLTextAreaElement;

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
    })
    .catch((error) => {
        console.error('Error:', error)
    });
}