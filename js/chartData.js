"use strict";

class ChartData {
    static load(src, callback, error) {

        function error_callback(e){
            console.log(e);
            if(error)error(e);
        }

        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function(e) {
            if(e.target.status === 200){
                try {
                    let data = JSON.parse(this.responseText);
                    callback(data);
                }
                catch (err) {
                    error_callback(err);
                }
            }
            else{
                error_callback(e);
            }
        });
        xhr.open("GET", src);
        xhr.send();
    }

    static isValid(data){
        return data.columns && data.colors && data.names && data.types;
    }
}

/*TCharts.getDate = function(unix_ms){
    let date = new Date(unix_ms);
    return date;
};*/







