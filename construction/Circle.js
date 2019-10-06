


function Circle(p1,p2,canvas) {
    this.center = p1 || new Point(0,0,canvas);
    this.radpoint = p2 || new Point(0,0,canvas);
    this.radius = Math.sqrt(Math.pow(this.center.x - this.radpoint.x, 2) + Math.pow(this.center.y - this.radpoint.y, 2));
    this.canvas = canvas;
    this.context = this.canvas.context2d;

    this.draw = function(color) {
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        this.context.stroke();

        this.center.draw();
        this.radpoint.draw();
    };
}