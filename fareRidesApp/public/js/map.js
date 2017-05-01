/////////////////////////////////////////////////////////////////////////////////////////////
//setting up the map//
/////////////////////////////////////////////////////////////////////////////////////////////

// set center coordinates
var centerlat = 32.878486;
var centerlon = -117.241435;

// set default zoom level
var zoomLevel = 15;

// initialize map
var map = L.map('map').setView([centerlat, centerlon], zoomLevel);

// set source for map tiles
ATTR = '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
  '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | ' +
  '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>';

CDB_URL = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

// add tiles to map
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
}).addTo(map);

/////////////////////////////////////////////////////////////////////////////////////////////
//generating the GeoJSON objects//
/////////////////////////////////////////////////////////////////////////////////////////////

//create some GeoJSON points to be sampled (function below)
var dotcount = 200000;
var dots = make_dots(dotcount);

//parameters for hex grid
//var bbox = [-117.341445, 32.778486, -116.241435, 32.978486];
var bbox = [-117.3, 32.8, -117.15, 32.95];
var cellWidth = 0.4;
var units = 'miles';

//create hex grid and count points within each cell
var hexgrid = turf.hexGrid(bbox, cellWidth, units);
//var hexcounts = turf.count(hexgrid, dots, 'pt_count');
//L.geoJson(hexcounts, {
//  onEachFeature: onEachHex
//}).addTo(map);

//var map = L.map('map').setView([centerlat, centerlon], zoomLevel);

//var map = L.mapbox.map('map', 'morganherlocker.kgidd73k')
//    .setView([35.463453, -102.508014], 4)
//    .featureLayer.setGeoJSON(hexgrid);

arr = [];
arr.length = 1000;
let i = 0;
while (i < 1000) {
  arr[i] = 0;
  i++;
}

//center
arr[299] = 700;

//1 away
arr[272] = 500;
arr[273] = 300;

arr[298] = 500;
arr[300] = 300;

arr[324] = 700;
arr[325] = 200;

//2 away
arr[246] = 000;
arr[247] = 000;
arr[248] = 000;

arr[271] = 100;
arr[274] = 100;

arr[297] = 100;
arr[301] = 000;

arr[323] = 200;
arr[326] = 100;

arr[350] = 400;
arr[351] = 300;
arr[352] = 000;

for(var x = 0; x < Object.keys(hexgrid.features).length; x++) {
  hexgrid.features[x].properties['pt_count'] = arr[x];
}

L.geoJson(hexgrid, {onEachFeature: onEachHex}).addTo(map);

function getRandomCoordinates(radius, uniform) {
  // Generate two random numbers1
  var a = Math.random(),
    b = Math.random();

  // Flip for more uniformity.
  if (uniform) {
    if (b < a) {
      var c = b;
      b = a;
      a = c;
    }
  }

  // It's all triangles.
  return [
    b * radius * Math.cos(2 * Math.PI * a / b),
    b * radius * Math.sin(2 * Math.PI * a / b)
  ];
}

function getRandomLocation(latitude, longitude, radiusInMeters) {
  var randomCoordinates = getRandomCoordinates(radiusInMeters, true);

  // Earths radius in meters via WGS 84 model.
  var earth = 6378137;

  // Offsets in meters.
  var northOffset = randomCoordinates[0],
    eastOffset = randomCoordinates[1];

  // Offset coordinates in radians.
  var offsetLatitude = northOffset / earth,
    offsetLongitude = eastOffset / (earth * Math.cos(Math.PI * (latitude / 180)));

  // Offset position in decimal degrees.
  return {
    latitude: latitude + (offsetLatitude * (180 / Math.PI)),
    longitude: longitude + (offsetLongitude * (180 / Math.PI))
  }
}

/*function make_dots() {
  var dots = {
    type: "FeatureCollection",
    features: []
  };

  for (var i = 0; i < dotcount; ++i) {
    var loc = getRandomLocation(40.767915, -73.972321, 1000);

    var t = L.marker([loc.latitude, loc.longitude]);

    dots.features.push(t.toGeoJSON());
  }

  return dots;
}
*/

/////////////////////////////////////////////////////////////////////////////////////////////
//legend//
/////////////////////////////////////////////////////////////////////////////////////////////

//create legend
var hexlegend = L.control({
  position: 'topright'
});
//generate legend contents
hexlegend.onAdd = function(map) {
  //set up legend grades and labels
  var div = L.DomUtil.create('div', 'info legend'),
    grades = [100, 200, 300, 400, 500, 600, 700],
    labels = ['<strong>Point Count</strong>'],
    from, to;

  //iterate through grades and create a color field and label for each
  for (var i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];
    labels.push(
      '<i style="background:' + getColor(from + 0.5) + '"></i> ' + from + (to ? '&ndash;' + to : '+'));
  }
  div.innerHTML = labels.join('<br>');
  return div;
};
hexlegend.addTo(map);

/////////////////////////////////////////////////////////////////////////////////////////////
//styling functions//
/////////////////////////////////////////////////////////////////////////////////////////////

//highlight style
var hexStyleHighlight = {
  color: "#336",
  weight: 2,
  opacity: 1,
};

//create color ramp
function getColor(y) {
  return y == undefined ? '#888' :
    y < 100 ? '#ffffe9' :
    y < 200 ? '#edf8b1' :
    y < 300 ? '#c7e9b4' :
    y < 400 ? '#7fcdbb' :
    y < 500 ? '#41b6c4' :
    y < 600 ? '#1d91c0' :
    y < 700 ? '#225ea8' :
    '#0c2c84';
}

//create style, with fillColor picked from color ramp
function style(feature) {
  return {
    fillColor: getColor(feature.properties.pt_count),
    color: "#888",
    weight: 0.5,
    opacity: 1,
    fillOpacity: 0.4//0.8
  };
}

//attach styles and popups to the hex layer
function highlightHex(e) {
  var layer = e.target;
  layer.setStyle(hexStyleHighlight);
  if (!L.Browser.ie && !L.Browser.opera) {
    layer.bringToFront();
  }
}

function resetHexHighlight(e) {
  var layer = e.target;
  var hexStyleDefault = style(layer.feature);
  layer.setStyle(hexStyleDefault);
}

function onEachHex(feature, layer) {
  layer.on({
    mouseover: highlightHex,
    mouseout: resetHexHighlight
  });
  var hexStyleDefault = style(layer.feature);
  layer.setStyle(hexStyleDefault);
  //for the sake of grammar
  if (feature.properties.pt_count == 1) {
    var be_verb = "There is";
    var point_s = "point";
  } else {
    var be_verb = "There are";
    var point_s = "points";
  }
  layer.bindPopup(be_verb + ' <b>' + feature.properties.pt_count + '</b> ' + point_s + ' in this cell.');

}

/////////////////////////////////////////////////////////////////////////////////////////////
//synthetic GeoJSON functions//
/////////////////////////////////////////////////////////////////////////////////////////////

//cheapo normrand function
function normish(mean, range) {
  var num_out = ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 4) / 4) * range + mean;
  return num_out;
}

//create geojson data with random ~normal distribution
function make_dots(dotcount) {

  var dots = {
    type: "FeatureCollection",
    features: []
  };

  for (var i = 0; i < dotcount; ++i) {

    //set up random variables
    /*x = normish(0, 4);
    y = normish(0, 4);

    //create points randomly distributed about center coordinates
    var g = {
        "type": "Point",
            "coordinates": [((x * 0.11) + centerlon), ((y * 0.1) + centerlat)]
    };

    //create feature properties, roughly proportional to distance from center coordinates
    var p = {
        "id": i,
            "popup": "Dot_" + i,
            "year": parseInt(Math.sqrt(x * x + y * y) * 60 * (1 - Math.random() / 1.5) + 1900),
            "size": Math.round((parseFloat(Math.abs((normish(y*y, 2) + normish(x*x, 2)) * 50) + 10)) * 100) / 100
    };*/

    var loc = getRandomLocation(40.769996, -73.973007, 5000);

    var t = L.marker([loc.latitude, loc.longitude]);

    dots.features.push(t.toGeoJSON());

    //create features with proper geojson structure        
    //dots.features.push({
    //    "geometry" : g,
    //    "type": "Feature",
    //    "properties": p
    //});
  }
  return dots;
}

window.onload = function showMark() {
    L.marker([32.878486, -117.241435]).addTo(map)
        .bindPopup('Current Location')
        .openPopup();
}
