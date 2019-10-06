
function Point(x,y,canvas) {
    
    // attributes
    this.x = x || 0;
    this.y = y || 0;
    this.canvas = canvas;
    this.context2d = this.canvas.context2d;

    // methods
    this.draw = function(color) {
        this.context2d.beginPath();
        this.context2d.strokeStyle = color;
        this.context2d.fillStyle = '#FFFFFF';
        this.context2d.arc(this.x, this.y, 3, 0, 2 * Math.PI);
        this.context2d.stroke();
        this.context2d.fill();
    };

}