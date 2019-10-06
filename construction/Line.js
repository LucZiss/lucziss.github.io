

function Line(p1,p2,canvas) {
    this.startPoint = p1 || new Point(0,0,canvas);
    this.endPoint = p2 || new Point(0,0,canvas);
    this.steps = 0;
    this.maxSteps = 2;
    this.canvas = canvas;
    this.context2d = this.canvas.context2d;

    this.draw = function(color) {
        this.context2d.beginPath();
        this.context2d.strokeStyle = color;
        this.context2d.moveTo(this.startPoint.x, this.startPoint.y);
        this.context2d.lineTo(this.endPoint.x, this.endPoint.y);
        this.context2d.stroke();

        this.startPoint.draw();
        this.endPoint.draw();
    };


}