


function Circle(p1,p2,canvasId) {
    this.center = p1 || new Point(0,0,canvasId);
    this.radpoint = p2 || new Point(0,0,canvasId);
    this.radius = Math.sqrt(Math.pow(this.center.x - this.radpoint.x, 2) + Math.pow(this.center.y - this.radpoint.y, 2));
    this.steps = 0;
    this.maxSteps = 2;
    this.canvas = canvasId;
    this.context = document.getElementById(this.canvas).getContext('2d');;

    this.draw = function(color) {
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        this.context.stroke();
    };
}