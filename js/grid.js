"use strict";

class Grid{
    constructor(chart, w, h){
        this.chart = chart;
        this.w = w;
        this.h = h;
    }

    draw(ctx, min, max){
        let result = false;

        let chart = this.chart;
        let color = this.chart.options.gridColor;
        let delta = Math.abs(min - max);

        let screen_step = chart.height / this.h;
        screen_step = Math.round(screen_step / 10) * 10;
        let step = Math.round(delta / this.h);
        step = Math.round(step / 10) * 10;

        //console.log([min, max, delta].join(" "));
        let count = 0;
        for(let y = chart.height - 1; y >= 0; y -= screen_step){
            console.log(y);
            let text = (min + (step * count++)) + "";
            Chart.drawText(ctx, 5, y - 5, 14, text, color);
            Chart.drawRect(ctx, 0, y, chart.width, 1, color);
        }

        /*if(delta > 0) {
            let step = Grid.getStep(min, max, this.h);
            if(step > 0){
                console.log([min, max, step].join(" "));

                for(let n = 0; n < max; n += step){
                    Chart.drawRect(ctx, 0, 100, chart.width, 1, color);
                }
            }
        }
        else {
            result = true;
        }*/

        return result;
    }

    static getStep(min, max, n){
        if(n === 0)n++;
        let delta = Math.abs(min - max);
        let step = Math.round(delta / n);

        let digits = [];
        while(step > 0){
            digits.push(step % 10);
            step = Math.round(step / 10);
        }
        if(digits.length > 0){
            let last = digits.length - 1;
            step = digits[last] * Math.pow(10, last);
            digits = null;
            return step;
        }
        return 0;
    }
}