"use strict";

const ChartDate = {
    Months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    Days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const DefaultChartOptions = {
    width: 400,
    height: 300,
    padding: 8,
    observerHeight: 60,
    lineWidth: 2.2,
    lineWidthObserver: 1.5,
    range: 30,
    backColor: "#fff",
    gridColor: "#96a2aa",
    //thumbColor: "rgba(0, 0, 0, 0.4)",
    //overlayColor: "rgba(128, 128, 128, 0.2)",
    //gapColor: "rgba(0, 0, 0, 0)",

    titleStyle: {},
    titleClass: "chartTitle",
    chartContainerStyle: {},
    chartContainerClass: "chartContainer",
    controlsContainerClass: "controlsContainer",
    //displayButtonStyle: {}, // CSSDeclaration style properties
    displayButtonClass: "displayButton",
    displayButtonClassHidden: "displayButton hidden",
    tooltipClass: "tooltip",
    tooltipTitleClass: "title",
    tooltipItemClass: "item",

    getColumnTitle: function(value, ext) {
        let date = new Date(value);
        let now = new Date();
        let wd = date.getDay();
        let d = date.getDate();
        let m = date.getMonth();
        let y = date.getFullYear();
        let y_now = now.getFullYear();
        //
        let month_name = ChartDate.Months[m % ChartDate.Months.length];
        let date_values = y !== y_now ? [d, month_name, y] : [d, month_name];
        if(!ext){
            return date_values.join(" ");
        }
        else{
            let day_name = ChartDate.Days[wd % ChartDate.Days.length];
            return [day_name, date_values.join(" ")].join(", ");
        }
    }
};

const LineStyle = {
    Line: "line",
    //Curve: "curve" // curves is added to make ability of extension
};

const RenderLayers = {
    None: 0,
    Main: 1,
    Front: 2,
    Observer: 4,
    All: 1 | 2 | 4,
};

class Chart {
    // ctor
    constructor(id, title, obj, options) {
        options = Object.assign({}, DefaultChartOptions, options);

        this.id = id;
        this.title = title;
        this.columns = [];
        this.width = options.width - (options.padding * 2);
        this.height = options.height;
        this.options = options;

        this.lines = [];
        this.dom = null;
        this.ctxMain = null;
        this.ctxFront = null;
        this.ctxObserver = null;
        this.selector = null;

        this.cursorPos = new Vec(-100, -100);
        //this.isFrameRequired = false;
        this.requiredLayers = 0;

        this.time = 0;
        this.deltaTime = 0.1;
        this.zoom = 0;
        this.offset = 0;
        this.selected = -1;
        this.selectedPos = -100;

        this.tooltip = new Tooltip(this);
        this.grid = new Grid(this, 6, 6);

        if(obj.columns !== null)
        {
            for(let i in obj.columns)
            {
                let values = obj.columns[i];

                let line_name = values[0];
                values.splice(0, 1);
                if(line_name === "x")
                {
                    this.columns = values;
                }
                else {
                    let color = obj.colors[line_name];
                    let name = obj.names[line_name];
                    let type = obj.types[line_name];

                    this.lines.push(new Line(this, line_name, name, color, type, values));
                }
            }
        }
    }

    // Markup

    build() {
        function div(){ return document.createElement("div"); }
        function canvas(){ return document.createElement("canvas"); }
        let options = this.options;
        let w = this.width;
        let h = this.height;
        //
        // Main container
        let dom = div();
        dom.id = this.id;
        dom.style.width = w + "px";
        dom.style.padding = options.padding + "px";
        dom.classList = options.chartContainerClass;
        Chart.style(dom, options.chartContainerStyle);

        // Title
        let titleBlock = div();
        titleBlock.classList = options.titleClass;
        Chart.style(titleBlock, options.titleStyle);
        titleBlock.innerText = this.title;
        dom.append(titleBlock);

        // Contains main and front canvases
        let graphContainer = div();
        Chart.style(graphContainer, {
            width: w + "px",
            height: h + "px",
            position: "relative",
        });
        dom.append(graphContainer);

        // Contains observer canvas
        let observerContainer = div();
        //observerContainer.style.width = w + "px";
        Chart.style(observerContainer, {
            position: "relative",
            overflow: "hidden"
        });
        dom.append(observerContainer);
        // Controls
        let controlsContainer = div();
        controlsContainer.classList = options.controlsContainerClass;
        //controlsContainer.style.width = w + "px";
        dom.append(controlsContainer);
        // Graph
        let canvasMain = canvas();
        let canvasFront = canvas();

        canvasMain.width = canvasFront.width = w;
        canvasMain.height = canvasFront.height = h;
        canvasMain.style.position = canvasFront.style.position = "absolute";

        graphContainer.append(canvasMain);
        graphContainer.append(canvasFront);
        graphContainer.append(this.tooltip.build(options));

        // Observer line
        let canvasObserver = canvas();

        canvasObserver.width = w;
        canvasObserver.height = options.observerHeight;

        observerContainer.append(canvasObserver);

        // Selector
        let selector = div();
        selector.classList = "selector";
        selector.style.position = "absolute";
        Chart.style(selector, {
            position: "absolute",
            boxSizing: "border-box",
            pointerEvents: "none",
            height: options.observerHeight + "px",
            top: "0",
        });
        this.selector = selector;

        observerContainer.append(selector);
        //
        for(let i = 0; i < this.lines.length; i++){
            let line = this.lines[i];
            let displayToggle = div();
            displayToggle.innerText = line.title;
            displayToggle.setAttribute("name", line.name);
            displayToggle.setAttribute("style", "--color: " + line.color);
            displayToggle.classList = options.displayButtonClass;
            //Chart.style(displayToggle, options.displayButtonStyle)
            //Chart.style(displayToggle, { backgroundColor: line.color })
            controlsContainer.append(displayToggle);

            let ch = this; // this chart
            displayToggle.addEventListener("click", function(e){
                line.hidden = !line.hidden;
                e.target.classList = !line.hidden ? options.displayButtonClass : options.displayButtonClassHidden;
                ch.requireFrame(RenderLayers.Main | RenderLayers.Front);
            });
        }
        //
        this.dom = dom;
        this.ctxMain = canvasMain.getContext("2d");
        this.ctxFront = canvasFront.getContext("2d");
        this.ctxObserver = canvasObserver.getContext("2d");
        //
        this.bindInputEvents(canvasMain, canvasFront, canvasObserver);
        //
        this.startRenderLoop();
        this.requireFrame(RenderLayers.All);
        this.updateSelector();
        //
        return dom;
    }

    // Input

    bindInputEvents(canvasMain, canvasFront, canvasObserver){
        let ch = this;
        canvasMain.chart = ch;
        canvasFront.chart = ch;
        canvasObserver.chart = ch;
        //

        let input = new InputManager(canvasFront, {
            mouseClick: function(e){
                console.log("Click!");
            },
            mouseMove: function(e){
                ch.cursorPos = InputManager.getMousePos(e.target, e);
                ch.selectColumn();
                ch.requireFrame(RenderLayers.Front);
            },
            /*mouseDown: function(e){

            },
            mouseUp: function(e){

            },*/
        });
        input.bind(["mouseleave", "touchend"], (e) => {
            ch.cursorPos = new Vec(-100, -100);
            ch.selectColumn();
            ch.requireFrame(RenderLayers.Front);
        });

        canvasFront.input = canvasMain.input = input;

        //

        let isGrabbed = false;
        let isResize = false;
        input = new InputManager(canvasObserver, {
            mouseClick: function(e){
                console.log("Click!");
                ch.cursorPos = InputManager.getMousePos(e.target, e);

                ch.updateSelector();
            },
            mouseMove: function(e){
                ch.cursorPos = InputManager.getMousePos(e.target, e);
                //chart.drawObserver(chart.ctxObserver);

                let resizePadding = 10;
                //let rect = ch.selector.rect;

                let canvasRect = canvasObserver.getBoundingClientRect();
                let selectorRect = ch.selector.getBoundingClientRect();

                let rect = new Rect(
                    selectorRect.left - canvasRect.left,
                    selectorRect.top - canvasRect.top,
                    selectorRect.width,
                    selectorRect.height
                );
                input.custom.rect = rect;

                let hover = rect.contains(ch.cursorPos);
                let leftRect = new Rect(rect.x, rect.y, resizePadding, rect.height);
                let rightRect = new Rect(rect.x + rect.width - resizePadding, rect.y, resizePadding, rect.height);
                let moveHover = !leftRect.contains(ch.cursorPos) && !rightRect.contains(ch.cursorPos);
                canvasObserver.style.cursor = hover ? (moveHover ? "pointer" : "e-resize") : "default";

                if(input.isDown || isGrabbed){
                    let local = (input.custom.localPos) ? input.custom.localPos.x : 0;

                    if(hover || isGrabbed){
                        if(moveHover || isGrabbed){
                            ch.offset = 1 - (ch.cursorPos.x / ch.width) - (local / ch.width); // = ch.cursorPos.x * (ch.columns.length / ch.width);
                            let lim = 1 - rect.width / ch.width;
                            ch.offset = Chart.clamp(ch.offset, 0, lim);
                            //console.log(ch.offset);

                            isGrabbed = true;
                        }
                        else{
                            if(rightRect.contains(ch.cursorPos)){
                                console.log("right");

                            }
                            if(leftRect.contains(ch.cursorPos)) {

                                console.log("left");
                                ch.zoom += 0.01;
                                ch.zoom = Chart.clamp(ch.zoom, 0.0001, 1);
                            }
                        }
                    }
                    else{
                        isGrabbed = false;
                    }
                }
                else{
                    isGrabbed = false;
                }

                ch.updateSelector();
                //ch.requireFrame(RenderLayers.Observer);

                /*console.log(rect);
                console.log(leftRect);
                console.log(rightRect);*/
            },
            /*mouseDown: function(e){

            },
            mouseUp: function(e){

            },*/
        });
        input.bind(["mousedown", "touchstart"], function(e){
            ch.cursorPos = InputManager.getMousePos(e.target, e);
            input.isDown = true;

            if(input.custom.rect){
                let rect = input.custom.rect;
                input.custom.localPos = new Vec(rect.width - (ch.cursorPos.x - rect.x), ch.cursorPos.y - rect.y);
            }
        });
        input.bind(["mouseup", "touchend"], function(e){
            ch.cursorPos = InputManager.getMousePos(e.target, e);
            isGrabbed = false;
            input.isDown = false;
            console.log(e);
        });
        input.bind(["mouseleave", "touchend"], (e) => {
            isGrabbed = false;
            input.isDown = false;
            console.log(e);
        });

        canvasObserver.input = input;
        //

        /*input = new InputManager(this.selector, {});

        input.bind("mousedown", function(e){

        });

        this.selector.input = input;*/
    }

    // Get selected point

    selectColumn(){
        let length = this.columns.length;
        let w = this.width * (1 / this.zoom);
        let offset = w - (w * this.offset) - (w * this.zoom);
        let x = offset + this.cursorPos.x;
        let xx = this.cursorPos.x;
        if(length > 0){
            let step = w / length;
            if(xx > 0 && xx < this.width){
                this.selected = Chart.clamp(Math.round(x / step), 0, length - 1);
                //this.selectedPos = this.selected * step;
                this.tooltip.update(true, this.selected, xx);
                return;
            }
        }
        this.selected = -1;
        //this.selectedPos = -100;
        this.tooltip.update(false, this.selected, x);
    }

    // Selector

    updateSelector(){
        if(this.selector){
            let selector = this.selector;
            let offset = this.offset;
            let zoom = this.zoom;

            // On first call we need to calculate a valid zoom value
            if(zoom === 0){
                zoom = this.options.range / this.columns.length;
                this.zoom = zoom;
            }

            let right = offset * this.width;
            let width = zoom * this.width;
            Chart.style(selector, {
                right: right + "px",
                width: width + "px",
            });

            selector.rect = new Rect(this.width - right - width, 0, width, this.options.observerHeight);

            this.requireFrame(RenderLayers.Main | RenderLayers.Front);
        }
    }

    // Rendering

    requireFrame(layer){
        //this.isFrameRequired = true;
        this.requiredLayers |= layer;
    }

    stop(layer){
        this.requiredLayers &= ~layer; // Removing layer from layer flag
    }

    startRenderLoop(){
        let ch = this;

        let loop = function(time){
            //if(ch.isFrameRequired)
            ch.draw(ch.requiredLayers, time);
            window.requestAnimationFrame(loop);
        };

        loop(0);
    }

    draw(layers, time) {
        let delta = Chart.clamp(time - this.time, 0, 20) / 1000;
        this.time = time;
        this.deltaTime = delta;
        //
        if(layers & RenderLayers.Main)this.drawMain(this.ctxMain);
        if(layers & RenderLayers.Front)this.drawFront(this.ctxFront);
        if(layers & RenderLayers.Observer)this.drawObserver(this.ctxObserver);
    }

    drawMain(ctx){
        Chart.clear(ctx);
        let result = false;
        let bounds = Line.getMinMax(this.lines);

        result |= this.grid.draw(ctx, bounds.min, bounds.max);

        for(let i in this.lines)
            result |= this.lines[i].draw(ctx, bounds.min, bounds.max, this.options.lineWidth, true, true, true);

        if(!result)
            this.stop(RenderLayers.Main);
        else
            this.requireFrame(RenderLayers.Main | RenderLayers.Front);
        //
        console.log(result);
    }

    drawFront(ctx){
        Chart.clear(ctx);
        let pos = -100;
        for(let i in this.lines) {
            let p = this.lines[i].drawFront(ctx);
            if(p.x > 0)pos = p.x;
        }
        Chart.drawRect(ctx, pos, 0, 1, this.height, this.options.gridColor);
        for(let i in this.lines) this.lines[i].drawFront(ctx);
        //Chart.drawRect(ctx, this.cursorPos.x, this.cursorPos.y, 5, 5, "#000");
        this.stop(RenderLayers.Front);
    }

    drawObserver(ctx)
    {
        Chart.clear(ctx);

        let bounds = Line.getMinMax(this.lines);
        for(let i in this.lines)
            this.lines[i].draw(ctx, bounds.min, bounds.max, this.options.lineWidthObserver, false, false, false);

        //Chart.drawRect(ctx, this.cursorPos.x, this.cursorPos.y, 5, 5, "#000");

       /* Chart.drawRect(ctx, 0, 0, 10, 60, this.options.thumbColor);
        Chart.drawRect(ctx, 100, 0, 10, 60, this.options.thumbColor);
        Chart.drawRect(ctx, 10, 0, 90, 2, this.options.thumbColor);
        Chart.drawRect(ctx, 10, 58, 90, 2, this.options.thumbColor);*/

        this.stop(RenderLayers.Observer);
    }

    // Utils

    static style(dom, styles){
        for(let prop in styles){
            dom.style[prop] = styles[prop];
        }
    }

    static clear(ctx){
        let w = ctx.canvas.width;
        let h = ctx.canvas.height;
        ctx.clearRect(0, 0, w, h);
    }

    static drawRect(ctx, x, y, w, h, color){
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    static drawCircle(ctx, x, y, r, color){
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
    }

    static drawText(ctx, x, y, size, text, color){
        ctx.font = size + "px sans-serif";
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }

    static lerp(a, b, r){
        return a + (b - a) * r;
    }

    static clamp(n, min, max){
        return n < min ? min : (n > max ? max : n);
    }
}