
const display = document.getElementById("display");
let result; 
let reg;

// Loops through the number buttons and registers pressNumBtn onclick
for (let i = 0; i < 10; i++) {
    registerListener(document.getElementById(i.toString()));
}

function registerListener(item) {
    item.addEventListener("click", pressNumBtn);
}

function pressNumBtn (e) {
    if (display.innerText === "0") {
        display.innerText = this.innerText;
    } else {
        display.innerText += this.innerText;
    }
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