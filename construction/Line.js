

function Line(p1,p2,canvasId) {
    this.startPoint = p1 || new Point(0,0,canvasId);
    this.endPoint = p2 || new Point(0,0,canvasId);
    this.steps = 0;
    this.maxSteps = 2;
    this.canvas = canvasId;
    this.context = document.getElementById(this.canvas).getContext('2d');;

    this.draw = function(color) {
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.moveTo(this.startPoint.x, this.startPoint.y);
        this.context.lineTo(this.endPoint.x, this.endPoint.y);
        this.context.stroke();
    };
}