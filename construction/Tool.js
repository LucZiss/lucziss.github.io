// define tools behaviour
function Tool(type) {
    this.type = type;
    this.step = 0;
    this.maxSteps;
    this.points = [];

    this.addPoint = function(p) {
        if(this.step < this.maxSteps) {
            this.points.push(p);
            this.step++;
        }
    }
    
    this.initToolSteps = function() {
        switch (this.type) {
            case 'l':
                this.maxSteps = 2;
                break;
            case 'c':
                this.maxSteps = 2;
                break;
            case 'p':
                this.maxSteps = 1;
        
            default:
                break;
        }
    }

    this.executeStep = function(s) {
        switch (this.type) {
            case 'l':
                if(s==1) {this.points[0].draw();};
                if(s==2) {this.points[1].draw(); new Line(this.points[0], this.points[1], canvas).draw();};
                break;

            case 'c':
                if(s==1) {this.points[0].draw();};
                if(s==2) {this.points[1].draw(); new Circle(this.points[0], this.points[1], canvas).draw();};
                break;

            case 'p':
                if(s==1) {this.points[0].draw();};
        
            default:
                break;
        }
    }
    
    this.drawSteps = function(step) { 
        switch (this.type) {
            case 'l':
                for (let st = 1; st <= step; st++) {
                    this.executeStep(st);          
                }
                break;

            case 'c':
                for (let st = 1; st <= step; st++) {
                    this.executeStep(st);          
                }
                break;

            case 'p':
                for (let st = 1; st <= step; st++) {
                    this.executeStep(st);          
                }
                break;
        
            default:
                break;
        }
    }

    this.drawOnDrag = function(step,p) {
        switch (this.type) {
            case 'l':
                this.drawSteps(step);
                p.draw();                    
                (new Line(this.points[step - 1], p,  canvas)).draw();
                break;

            case 'c':
                this.drawSteps(step);
                p.draw();                    
                (new Circle(this.points[step - 1], p,  canvas)).draw();
                break;
        
            default:
                break;
        }
    }

    this.initToolSteps();
}