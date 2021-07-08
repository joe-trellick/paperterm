console.log("main.ts is loaded");

var inputField:HTMLInputElement;

// Wait for DOM and then attach handlers
document.addEventListener("DOMContentLoaded", () => {
    attachEventListeners();
});

function attachEventListeners() {
    // Add return key support for input
    inputField = document.getElementById("command") as HTMLInputElement;
    inputField.addEventListener("keyup", ({key}) => {
        if (key === "Enter") {
            sendCommand();
        }
    });
}

function sendCommand() {
    let input:string = inputField.value;
    console.log(`The input is "${input}"`);
}