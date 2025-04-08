
const display = document.getElementById("display");
let result; 
let reg;

// Loops through the number buttons and registers pressNumBtn onclick
for (let i = 0; i < 10; i++) {
    registerListeners(document.getElementById(i.toString()));
}

function registerListeners(item) {
    item.addEventListener("click", pressNumBtn);
    item.addEventListener("mousedown", btnStyle);
    item.addEventListener("mouseup", btnDeStyle);
}

function pressNumBtn (e) {
    if (display.innerText === "0") {
        display.innerText = this.innerText;
    } else {
        display.innerText += this.innerText;
    }
}

function btnStyle (e) {
    this.style.backgroundColor = "white";
}

function btnDeStyle (e) {
    this.style = "initial";
}


btnProcent.addEventListener("click", pressNumBtn);
btnDivide.addEventListener("click", pressNumBtn);
btnMultiply.addEventListener("click", pressNumBtn);
btnAdd.addEventListener("click", pressNumBtn);
btnSubtract.addEventListener("click", pressNumBtn);

const btnUnion = document.getElementById("()");
const btnProcent = document.getElementById("%");
const btnAC = document.getElementById("AC");
const btnDivide = document.getElementById("/");
const btnMultiply = document.getElementById("x");
const btnSubtract = document.getElementById("-");
const btnAdd = document.getElementById("+");
const btnResult = document.getElementById("=");
const btnBack = document.getElementById("back");
const btnPoint = document.getElementById(".");