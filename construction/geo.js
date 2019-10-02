'use strict';

let currentTool = 'l';
let uptCanvas = new Event('updateCanvas');
let canvasId = 'geometry-canvas';
let canvas = document.getElementById(canvasId);

let itemsToDraw = [];
let itemIndex = 0;
let lastDraw;

let lastDownX = 0, lastDownY = 0;
let isLMBDown = false, hasDragged = false;
let currentOperation;

let toolsnames = ['l','t','c','p'];
let tools = {};
/* 
toolsnames.forEach(function(d) {
    tools[d] = new Tool(d);
}); */


window.onresize = resizeCanvas;
resizeCanvas();

function resizeCanvas() {
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;
}

function updateCanvas(event) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    itemsToDraw.forEach(function(d) {
       d.drawSteps(d.maxSteps); 
    });
}

function keyManager(key) {
    console.log(key.code);
    switch(key.code) {
        case 'KeyC' : // 'c'
            currentTool = 'c';
            currentOperation = undefined;
            break;

        case 'KeyL' : // 'l'
            currentTool = 'l';
            currentOperation = undefined;
            break;
    }
    document.dispatchEvent(uptCanvas);
}


function drawMDown(event) {
    lastDownX = event.clientX - canvas.offsetLeft;
    lastDownY = event.clientY - canvas.offsetTop;
    isLMBDown = true;
    hasDragged = false;
    console.log(currentTool);
}

function drawMMove(event) {
    let deltaX = Math.abs(event.clientX - canvas.offsetLeft - lastDownX);
    let deltaY = Math.abs(event.clientY - canvas.offsetTop - lastDownY);

    if (isLMBDown && (deltaX > 8 || deltaY > 8)) {
        // user is dragging
        if(!hasDragged) {
            // beginning of drag trigger
            hasDragged = true;

            // create new operation
            if(currentOperation === undefined) {
                currentOperation = new Tool(currentTool);
                currentOperation.addPoint(new Point(lastDownX, lastDownY, canvasId));
            }
        }


        document.dispatchEvent(uptCanvas);
        currentOperation.drawOnDrag(currentOperation.step, new Point(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop, canvasId));


    } else {
        if(currentOperation !== undefined && currentOperation.step != currentOperation.maxSteps) {
            document.dispatchEvent(uptCanvas);
            currentOperation.drawOnDrag(currentOperation.step, new Point(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop, canvasId));
        } 
    }
}

function drawMUp(event) {
    isLMBDown = false;


    if(!hasDragged) {
        // user has clicked without dragging
        console.log("click");

        // create new operation if not started
        if(typeof(currentOperation) === 'undefined') {
            currentOperation = new Tool(currentTool);
        }

        // continue existing operation
        currentOperation.addPoint(new Point(lastDownX, lastDownY, canvasId));

    } else {
        // user stopped dragging
        currentOperation.addPoint(new Point(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop, canvasId));
    }

    

    //document.dispatchEvent(uptCanvas);
    //currentOperation.drawSteps(currentOperation.step);



    if(currentOperation.step == currentOperation.maxSteps) {
        itemsToDraw.push(currentOperation);
        currentOperation = undefined;
    }

    document.dispatchEvent(uptCanvas);



}

document.addEventListener('keypress', keyManager);
document.addEventListener('updateCanvas', updateCanvas);   
document.addEventListener('mousedown',drawMDown);
document.addEventListener('mousemove',drawMMove);
document.addEventListener('mouseup',drawMUp);