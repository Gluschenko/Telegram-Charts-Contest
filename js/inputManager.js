"use strict";

class InputManager {
    constructor(dom, options) {
        function def(e){}
        let defaultOptions = {
            mouseClick: def,
            mouseDown: def,
            mouseUp: def,
            mouseMove: def,
        };

        this.isDown = false;
        this.isUp = false;
        this.custom = {};

        this.dom = dom;
        this.options = Object.assign({}, defaultOptions, options);
        //
        this.bindEvents(this.options);
    }

    bindEvents(options){
        let mgr = this;

        // Just for testing and debug
        mgr.bind("click", function(e){
            options.mouseClick(e);
        });
        mgr.bind(["mousedown", "touchstart"], function(e){
            console.log(e);
            mgr.isDown = true;
            options.mouseDown(e);
            mgr.isDown = false;
        });
        mgr.bind(["mouseup", "touchend"], function(e){
            console.log(e);
            mgr.isUp = true;
            options.mouseUp(e);
            mgr.isUp = false;
        });
        mgr.bind(["mousemove", "touchmove"], function(e){
            options.mouseMove(e);
        });
    }

    bind(name, func) {
        if (!Array.isArray(name))
            this.dom.addEventListener(name, func);
        else
            for (let i in name)
                this.dom.addEventListener(name[i], func);
    }

    //

    static getMousePos(dom, e) {
        let rect = dom.getBoundingClientRect();
        if(!e.touches) // Mouse
        {
            return new Vec(e.clientX - rect.left, e.clientY - rect.top);
        }
        else { // Touchscreen
            if(e.touches.length > 0){
                let t = e.touches[0];
                return new Vec(t.clientX - rect.left, t.clientY - rect.top);
            }
        }
        return new Vec();
    }
}