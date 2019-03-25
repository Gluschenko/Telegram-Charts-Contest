"use strict";

class Tooltip{
    constructor(chart){
        this.chart = chart;
        this.dom = null;
    }

    build(options){
        let container = this.div();
        container.classList = options.tooltipClass;
        this.dom = container;
        return container;
    }

    update(show, selected, pos){
        if(!this.dom)return;

        if(show){
            let chart = this.chart;
            let tooltip = this.dom;
            let options = this.chart.options;
            tooltip.innerHTML = "";
            //

            let title = this.div();
            title.classList = options.tooltipTitleClass;
            title.innerText = options.getColumnTitle(chart.columns[selected], true);
            this.dom.append(title);

            for(let i in chart.lines){
                let line = chart.lines[i];
                if(!line.hidden){
                    let item = this.div();
                    item.classList = options.tooltipItemClass;
                    item.innerText = line.values[selected];
                    item.setAttribute("title", line.title);
                    item.setAttribute("style", "--color: " + line.color);

                    this.dom.append(item);
                }
            }
            //
            let rect = tooltip.getBoundingClientRect();
            let padding = 8;
            let offset = pos + padding;
            if(offset + rect.width > chart.width){
                offset -= rect.width + (padding * 2);
            }

            tooltip.style.display = "block";
            Chart.style(tooltip, {
                display: "block",
                left: offset + "px",
            });
        }
        else{
            this.dom.style.display = "none";
        }
    }

    div(){ return document.createElement("div"); }
}

