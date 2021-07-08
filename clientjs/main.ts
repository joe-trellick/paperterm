console.log("main.ts is loaded");

function goButton() {
    let inputField:HTMLInputElement = document.getElementById("command") as HTMLInputElement;
    let input:string = inputField.value;
    console.log(`The input is "${input}"`);
}