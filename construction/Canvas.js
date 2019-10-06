// class Canvas

function Canvas(_id) {
    this.id = _id;
    this.HTMLObject = document.getElementById(_id);
    this.context2d = this.HTMLObject.getContext('2d');
    this.items = [];

    this.clear = function() {
        this.context2d.clearRect(0, 0, this.HTMLObject.width, this.HTMLObject.height);

    }
    this.draw = function() {
        this.clear();

        this.items.forEach(d => {            
            d.drawSteps(d.maxSteps);            
        });
    }

    this.resize = function() {
        this.HTMLObject.width = window.innerWidth - 20;
        this.HTMLObject.height = window.innerHeight - 20;
    }

    this.resize();
}