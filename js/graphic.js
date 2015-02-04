var circleSize = 70;

var colors = {
    'red1': '#6C2315', 'red2': '#A23520', 'red3': '#D8472B', 'red4': '#E27560', 'red5': '#ECA395', 'red6': '#F5D1CA',
    'orange1': '#714616', 'orange2': '#AA6A21', 'orange3': '#E38D2C', 'orange4': '#EAAA61', 'orange5': '#F1C696', 'orange6': '#F8E2CA',
    'yellow1': '#77631B', 'yellow2': '#B39429', 'yellow3': '#EFC637', 'yellow4': '#F3D469', 'yellow5': '#F7E39B', 'yellow6': '#FBF1CD',
    'teal1': '#0B403F', 'teal2': '#11605E', 'teal3': '#17807E', 'teal4': '#51A09E', 'teal5': '#8BC0BF', 'teal6': '#C5DFDF',
    'blue1': '#28556F', 'blue2': '#3D7FA6', 'blue3': '#51AADE', 'blue4': '#7DBFE6', 'blue5': '#A8D5EF', 'blue6': '#D3EAF7'
};

/*
 * Render the graphic
 */
//check for svg
function draw_graphic(){
    if (Modernizr.svg){
        $('#map').empty();
        var width = $('#map').width();
        render(width);
        //window.onresize = draw_graphic; /
        //very important! the key to responsiveness
    }
}

function render(width) {

 //leaflet stuff

    //make a map                        
    var map = new L.Map("map", {
        center: [37.60, -122.21], //lat, long, not long, lat
        zoom: 10,
        scrollWheelZoom: false}) 
        .addLayer(new L.TileLayer("http://api.tiles.mapbox.com/v4/nbclocal.k38kb5c1/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibmJjbG9jYWwiLCJhIjoiS3RIUzNQOCJ9.le_LAljPneLpb7tBcYbQXQ", {
    attribution: 'Map tiles by MapBox. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    }));

    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    // var svg = d3.select("#map").select("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

    var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);

    //leaflet implements a geometric transformation
    function projectPoint(x, y){
        var point = map.latLngToLayerPoint(new L.LatLng(y,x));
        this.stream.point(point.x, point.y);
    }


//////////////new//////
map.on("viewreset", reset);

    function reset(){

        ///find bounds of collection of paths/////
        bounds = path.bounds(hospitals);

        var topLeft = bounds[0],
            bottomRight = bounds[1];

        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");
        
        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        update();

     }

    reset();

    ////////////////tooltip stuff////////////////
    //create tip container in d3 for local
    var div = d3.select("#map").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0); //hide till called

    // //format for tooltip percentages
    var percentFormat = function(d){
        if (d) { return (d3.format("%"))(d) }
        else { return "0%"}
        }

    // //define tip
    var hospitalTip = d3.tip()
        .attr("class", 'd3-tip')
        .style("max-width", "150px")
        .offset([-10, 0])
        .html(function(d) { return "Name</br>" + d.properties.Name + " complete.</br>SPC1 Buildings: " + d.properties.num_spc1;
    });

    // //call both tips
    g.call(hospitalTip);

    //////////////end tooltip/////////////
    // //add a latlng object to each item in the dataset
    hospitals.features.forEach(function(d) {
        d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
    });

    var noSPC1Color = "darkgreen";
    var spc1Color = "darkred";

    //get color sorted out for local.js
    hospitals.features.forEach(function(d){
        d.properties.one_or_mo == "False" ? d.properties.color = noSPC1Color : d.properties.color = spc1Color;
        d.properties.num_spc_one = +d.properties.num_spc1;
    });

    //circles for local.js
    function hospitalFeatures(){
        var feature = g.selectAll(".hospitals")
            .data(hospitals.features)
            .enter().append("circle")
            .attr("r", function(d){
                var num = d.properties.num_spc_one; 
                return num * 2 + 8})
            .attr("class", "hospitals")
            .style("fill", function(d){return d.properties.color; })
            .style("opacity", 0.7)
            .style("stroke", "white")
            .style("stroke-width", 0.3)
            .on("mouseover", function(d,i){ 
                // hospitalTip.show(d);
                d3.select(this).each(highlight);}
                )
            .on("click", hospitalTip.show)
            .on("mouseout", function(d,i){ 
                hospitalTip.hide(d);
                d3.select(this).each(unhighlight);}
                );
        }

    //build local feature circles
    hospitalFeatures();

    var outerScope = { original: 0 };

    // highlight function for mouseover
    var highlight = function(){
        //store original size of dot
        outerScope.original = d3.select(this).attr("r");
        //generate an actual d3 selection and do stuff
        d3.select(this).style("opacity", 0.9).style("stroke-width", 3.5).style("stroke", "yellow");
    };
    //unhighlight
    var unhighlight = function(){
        d3.select(this).attr("r", outerScope.original).style("opacity", 0.7).style("stroke-width", 0.5);
    };

    //helper function sends properties to the console
    function clickForFeatures(d){ console.log(d.properties);}
   
    //my helper function
    map.on("click", showLocation);

    function showLocation(e){
        console.log(e.latlng);
    }

    //define update: (called on reset)
    function update() {
        //transform hospitals points to geo
        g.selectAll(".hospitals").attr("transform",
            function(d){
                return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
            }
        );
    }

    update();

    ////delay constants
    var myDelay = function(d,i){return i * 0.8;};
    var myDuration = 5;

/////////////key//////////////

var info = L.control({position: 'topleft'});

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    // this.update();
    return this._div;
};

info.addTo(map);

    function buildLegendSVG(){
        var legend = d3.select(".info").append("svg")
            .attr("id", "infoSVG")
            .attr("width", 225)
            .attr("height", 75);

        legend.append("g")
                .attr("class", "circleKey")
            .selectAll("g")
                .data([{"color": spc1Color, "text": "Hospital has SPC1 Buildings"}, {"color": noSPC1Color, "text": "No SPC1 Buildings"}])
                .enter().append("g")
                .attr("class", "colorsGroup")
                .attr("transform", "translate(18, 18)");

        //some ky values that i'll repeat
        var keyRadius = 12;
        //make the circles
        legend.selectAll(".colorsGroup").append("circle")
            .style("stroke-width", 1.0)
            .style("fill", function(d){ return d.color; })
            .style("stroke", "black")
            .attr("r", keyRadius)
            .attr("cy", function(d,i){ return i * keyRadius*3;});

        //add annotations
        legend.selectAll(".colorsGroup").append("text")
            .attr("class","infoText")
            .attr("x", keyRadius*1.5)
            .attr("y", function(d,i){ return keyRadius*3 * i + 5;})
            .text(function(d){return d.text;});
    }//end buildLegendSVG
    
    buildLegendSVG(); 

    //add slide button
    function addSlide(){
        $(".info").append('<div id="slide-control" class="buttons btn-group btn-group-justified"> <a class="slide-up btn"><span class="glyphicon glyphicon-chevron-up"> </span></a> </div>');
    }   

    addSlide();

    //slide up code
    function addSlideEffects(){
        $(".slide-up").on("click", function(){
            console.log("slide up fired");
            $("#infoSVG").slideToggle("slow");
            $(".glyphicon").toggleClass("glyphicon-chevron-down").toggleClass("glyphicon-chevron-up");
         });
    }

    addSlideEffects();
    //slide down code

} //end render

/*
 * NB: Use window.load instead of document.ready
 * to ensure all images have loaded
 */
$(window).load(function() {
    draw_graphic();
});






