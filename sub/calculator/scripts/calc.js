
const display = document.getElementById("display");
let result; 
let reg;

for (let i = 0; i < 14; i++) {
    registerListeners(document.getElementById(i.toString()));
}

function registerListeners(item) {
    item.addEventListener("mousedown", btnStyle);
    item.addEventListener("mouseup", btnDeStyle);
    item.addEventListener("click", pressNumBtn);
}

function btnStyle (e) {
    this.style.backgroundColor = "white";
}

function btnDeStyle (e) {
    this.style = "initial";
}

function calculate() {
    eval(display.innerText);
}

function pressNumBtn (e) {
    if (display.innerText === "0") {
        display.innerText = this.innerText;
    } else {
        display.innerText += this.innerText;
    }
}

document.getElementById("15").addEventListener("click", calculate);
