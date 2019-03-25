"use strict";

class Line {
    constructor(chart, name, title, color, type, values){
        this.chart = chart;
        this.name = name;
        this.title = title;
        this.color = color;
        this.type = type;
        this.values = values;

        this.hidden = false;
        this.alpha = 1;
        this.points = [];
    }

    draw(ctx, min, max, lineWidth, useAnimation, subMinValue, useZoom) {
        let result = false;

        let delta = this.chart.deltaTime;
        let w = ctx.canvas.width;
        let h = ctx.canvas.height;

        let values = [];
        if(subMinValue)
        {
            max -= min;
            for(let i in this.values)
            {
                values[i] = this.values[i] - min;
            }
        }
        else{
            values = this.values;
        }

        let offsetX = 0;
        if(useZoom){
            w *= 1 / this.chart.zoom;
            offsetX = w - (w * this.chart.offset) - (w * this.chart.zoom);
        }

        //let bounds = Line.getMinMax(this.chart.lines);
        //let max = bounds.max; //Math.max.apply(null, this.values);
        //let min = bounds.min; //Math.min.apply(null, this.values);

        let stepWidth = w / (values.length - 1);
        let stepHeight = h / (max + 1);

        // Alpha

        let tempAlpha = ctx.globalAlpha;

        if(useAnimation){
            let target = this.hidden ? 0 : 1;
            result |= Math.abs(this.alpha - target) < 0.0001;
            this.alpha = Chart.clamp(Chart.lerp(this.alpha, target, delta * 16), 0, 1);
            ctx.globalAlpha = this.alpha;
        }
        else {
            this.alpha = 1;
        }
        //

        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineJoin = "round";
        ctx.lineWidth = lineWidth ? lineWidth : this.chart.options.lineWidth;

        let L = this;
        let getPoint;
        if(useAnimation){
            getPoint = function(x, y, i){
                if(i < L.points.length) {
                    return L.points[i] = Vec.lerp(L.points[i], new Vec(x, y), delta * 16);
                }
                else{
                    return L.points[i] = new Vec(x, y);
                }
            };
        }
        else{
            getPoint = function(x, y, i){
                return new Vec(x, y);
            };
        }

        let max_dist = 0;
        for(let i in this.values)
        {
            let nx = stepWidth * i - offsetX;
            let ny = h - (stepHeight * values[i]);
            let p = getPoint(nx, ny, i);

            if(this.type === LineStyle.Line)
            {
                ctx.lineTo(p.x, p.y);
            }

            //result |= Vec.dist(p, new Vec(nx, ny)) < 0.02;
            let dist = Vec.dist(p, new Vec(nx, ny));
            if(max_dist < dist) max_dist = dist;

            /*if(this.type === LineStyle.Curve)
            {
                let x = stepWidth * i;
                let y = h - (stepHeight * this.values[i]);

                let rx = (x + nx)/2;
                let ry = (y + ny)/2;

                ctx.bezierCurveTo(rx, y, rx, ny, nx, ny);
            }*/
        }
        if(max_dist > 0.1)result = false;

        ctx.stroke();
        ctx.globalAlpha = tempAlpha;
        return !result;
    }

    drawFront(ctx){
        let result = new Vec(-100, -100);

        if(!this.hidden){
            let selected = this.chart.selected;
            let points = this.points;

            if(selected >= 0 && selected < points.length)
            {
                let p = points[selected];
                Chart.drawCircle(ctx, p.x, p.y, 6, this.color);
                Chart.drawCircle(ctx, p.x, p.y, 4, this.chart.options.backColor);
                result = p;
            }
        }

        return result;
    }

    static getMinMax(lines){
        let min = [];
        let max = [];

        function mx(arr){ return Math.max.apply(null, arr); }
        function mn(arr){ return Math.min.apply(null, arr); }

        lines.forEach(function(line){
            if(!line.hidden)
            {
                min.push(mn(line.values));
                max.push(mx(line.values));
            }
        });

        return {
            min: mn(min),
            max: mx(max)
        };
    }
}
