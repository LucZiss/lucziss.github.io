'use strict';

// Start tool : line mode
let currentTool = 'l';

// canvas HTML ID
let canvasId = 'geometry-canvas';

// Canvas JS object
let canvas = new Canvas(canvasId);

// Last mousedown position by user
let lastDownX = 0, lastDownY = 0;

// Define if user has left mouse button down and if he's dragging
let isLMBDown = false, hasDragged = false;
let currentOperation;

// Resize canvas when window is resized
window.onresize = canvas.resize();

// Manage user keyboard input
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

        case 'KeyP' : // 'p'
            currentTool = 'p';
            currentOperation = undefined;
            break;
    }
    canvas.draw();
}


function drawMDown(event) {
    lastDownX = event.clientX - canvas.HTMLObject.offsetLeft;
    lastDownY = event.clientY - canvas.HTMLObject.offsetTop;
    isLMBDown = true;
    hasDragged = false;
}

function drawMMove(event) {

    // dragging distance
    let deltaX = Math.abs(event.clientX - canvas.HTMLObject.offsetLeft - lastDownX);
    let deltaY = Math.abs(event.clientY - canvas.HTMLObject.offsetTop - lastDownY);

    // if (user is dragging)
    if (isLMBDown && (deltaX > 8 || deltaY > 8)) {

        // beginning of drag trigger
        if(!hasDragged) {
            hasDragged = true;

            // create new operation
            if(currentOperation === undefined) {
                currentOperation = new Tool(currentTool);
                currentOperation.addPoint(new Point(lastDownX, lastDownY, canvas));
            }
        }

        // during dragging
        canvas.draw();
        currentOperation.drawOnDrag(currentOperation.step, new Point(event.clientX - canvas.HTMLObject.offsetLeft, event.clientY - canvas.HTMLObject.offsetTop, canvas));

    // mouse moves without clicking
    } else {
        if(currentOperation !== undefined && currentOperation.step != currentOperation.maxSteps) {
            canvas.draw();
            currentOperation.drawOnDrag(currentOperation.step, new Point(event.clientX - canvas.HTMLObject.offsetLeft, event.clientY - canvas.HTMLObject.offsetTop, canvas));
        } 
    }
}

function drawMUp(event) {
    isLMBDown = false;

    // user has clicked without dragging
    if(!hasDragged) {

        // create new operation if not started
        if(typeof(currentOperation) === 'undefined') {
            currentOperation = new Tool(currentTool);
        }

        // continue existing operation
        currentOperation.addPoint(new Point(lastDownX, lastDownY, canvas));

    } else {
        // user stopped dragging
        currentOperation.addPoint(new Point(event.clientX - canvas.HTMLObject.offsetLeft, event.clientY - canvas.HTMLObject.offsetTop, canvas));
    }

    // if tool use is complete, add geometric item to canvas items to draw
    if(currentOperation.step == currentOperation.maxSteps) {
        canvas.items.push(currentOperation);
        currentOperation = undefined;
    }

    canvas.draw();

}

// Event listeners
document.addEventListener('keypress', keyManager); 
document.addEventListener('mousedown',drawMDown);
document.addEventListener('mousemove',drawMMove);
document.addEventListener('mouseup',drawMUp);