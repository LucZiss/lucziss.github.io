
function Point(x,y,canvasId) {
    
    // attributes
    this.x = x || 0;
    this.y = y || 0;
    this.canvas = canvasId;
    this.context = document.getElementById(this.canvas).getContext('2d');

    // methods
    this.draw = function(color) {
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.arc(this.x, this.y, 3, 0, 2 * Math.PI);
        this.context.stroke();
    };
}