"use strict";

class Vec {
    constructor(x, y){
        this.x = x ? x : 0;
        this.y = y ? y : 0;
    }

    static lerp(a, b, r) // Linear interpolation
    {
        let x = a.x + (b.x - a.x) * r;
        let y = a.y + (b.y - a.y) * r;
        return new Vec(x, y);
    }

    static dist(a, b){
        let dx = a.x - b.x,
            dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static cmp(a, b)
    {
        return a.x === b.x && a.y === b.y;
    }

    static delta(a, b)
    {
        return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) / 2;
    }
}

class Rect {
    constructor(x, y, w, h){
        this.x = x ? x : 0;
        this.y = y ? y : 0;
        this.width = w ? w : 0;
        this.height = h ? h : 0;
    }

    contains(v){
        let r = this;
        return (v.x >= r.x && v.x < (r.x + r.width)) && (v.y >= r.y && v.y < (r.y + r.height));
    }

}
