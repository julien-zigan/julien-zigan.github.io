const display = document.getElementById("display");

for (let i = 0; i < 16; i++) {
    registerListeners(document.getElementById(i.toString()));
}

function registerListeners(item) {
    item.addEventListener("mousedown", btnStyle);
    item.addEventListener("mouseup", btnDeStyle);
    if (item.getAttribute("id") < 15) {
        item.addEventListener("click", pressNumBtn);
    }
    else {
        item.addEventListener("click", calculate);
    }
}

function btnStyle (e) {
    this.style.backgroundColor = "white";
}

function btnDeStyle (e) {
    this.style = "initial";
}

function pressNumBtn (e) {
    if (display.innerText === "0") {
        display.innerText = this.innerText;
    } else {
        display.innerText += this.innerText;
    }
}

function calculate() {
    display.innerText = eval(display.innerText);
}