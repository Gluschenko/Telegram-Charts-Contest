let charts = [];
ChartData.load("chart_data.json", function(data){

    let start = new Date().getTime();

    let parent = document.getElementById("charts");
    let i = 0;
    data.forEach(function(chart_data){
        if(ChartData.isValid(chart_data))
        {
            let ch = new Chart("ch_" + i++, "Followers", chart_data, {
                width: document.body.clientWidth < 500 ? window.document.body.clientWidth : 500,
                height: 300,
            });
            parent.append(ch.build());
            charts.push(ch);
            console.log(ch);
        }
        else{
            alert("Format error!");
            console.log(chart_data);
        }
    });
    //
    let end = new Date().getTime();
    console.log((end - start) + " microseconds");
});

let isNight = false;
function switchNightMode(){
    isNight = !isNight;

    document.body.classList = isNight ? "night" : "";

    setTimeout((function () {
        let bodyStyle = window.getComputedStyle(document.getElementsByTagName("body")[0]);
        for(let i in charts){
            charts[i].options.backColor = isNight ? bodyStyle.backgroundColor : "#fff";
            charts[i].requireFrame(RenderLayers.All);
        }
    }), 500);
}