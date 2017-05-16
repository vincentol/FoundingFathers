/////////////////////////////////////////////////////////////////////////////////////////////
//setting up the map//
/////////////////////////////////////////////////////////////////////////////////////////////

// set center coordinates
var centerlat = 32.878486;
var centerlon = -117.241435;

// set default zoom level
var zoomLevel = 15;



// set source for map tiles
ATTR = '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
  '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | ' +
  '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>';

CDB_URL = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

//Mapzen API Key
L.Mapzen.apiKey = "mapzen-2DryXS8";
// initialize map
var map = L.Mapzen.map('map');
map.setView([centerlat, centerlon], 15);

control = L.Routing.control({
  waypoints: [
    L.latLng(centerlat, centerlon)
  ],
  router: L.Routing.mapzen("mapzen-2DryXS8", {costing:"pedestrian"}),
  formatter: new L.Routing.mapzenFormatter(),
  summaryTemplate:'<div class="start">{name}</div><div class="info {costing}">{distance}, {time}</div>',
  routeWhileDragging: false,
  fitSelectedRoutes: false
  //routeWhileDragging: true

});
control.addTo(map);

addMarkers();

function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}

marker1.on('click', function(e){
    control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
});

marker2.on('click', function(e){
    control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
});

marker3.on('click', function(e){
    control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
});


map.on('click', function(e) {
    control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
    map.closePopup();
});


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

/////////////////////////////////////////////////////////////////////////////////////////////
//legend//
/////////////////////////////////////////////////////////////////////////////////////////////

//create legend
var hexlegend = L.control({
  position: 'bottomleft'
});
//generate legend contents
hexlegend.onAdd = function(map) {
  //set up legend grades and labels
  var div = L.DomUtil.create('div', 'info legend'),
    grades = [1, 1.3, 1.5, 1.7, 2],
    labels = ['<strong>Surge Percentage</strong>'],
    colorval = [100, 200, 300, 400, 500],
    from, to;

  //iterate through grades and create a color field and label for each
  for (var i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];
    colorin = colorval[i];
    labels.push(
      '<i style="background:' + getColor(colorin) + '"></i> ' + from + (to ? '&ndash;' + to : '+'));
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
    y < 100 ? '#FFFFFF':
    y < 200 ? '#FFFFFF' :
    y < 300 ? '#FFFE11' :
    y < 400 ? '#E8C115' :
    y < 500 ? '#FFA100' :
    y < 600 ? '#E8610C' :
    y < 700 ? '#FF2000' :
    '#0c2c84';
}

//create style, with fillColor picked from color ramp
function style(feature) {
  return {
    fillColor: getColor(feature.properties.pt_count),
    color: "#888",
    weight: 0.5,
    opacity: 1,
    fillOpacity: 0.2//0.8
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
  var hexStyleDefault = style(layer.feature);
  layer.setStyle(hexStyleDefault);
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
    var loc = getRandomLocation(40.769996, -73.973007, 5000);

    var t = L.marker([loc.latitude, loc.longitude]);

    dots.features.push(t.toGeoJSON());
  }
  return dots;
}

function setPrefs() {
  var x = document.getElementById("pref_form");
  var dist = (x.elements[0].value);
  console.log(dist);
  map.setZoom((32-dist)/2);
  closeNav();
  return false;
}

function loadPrices(){
/*
//center
arr[299] = 500;

//1 away
arr[272] = 400;
arr[273] = 300;

arr[298] = 400;
arr[300] = 300;

arr[324] = 500;
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
*/

  for(var x = 0; x < Object.keys(hexgrid.features).length; x++) {
    hexgrid.features[x].properties['pt_count'] = prices[x];
  }

  L.geoJson(hexgrid, {onEachFeature: onEachHex}).addTo(map);
}

function addMarkers()
{
    marker1 = L.marker([32.882, -117.236])
      .bindTooltip("Suggested location",
          {
            permanent: true,
            direction: 'right'
          }
    ).addTo(map);

    marker2 = L.marker([32.879, -117.246])
      .bindTooltip("Suggested location",
          {
            permanent: true,
            direction: 'right'
          }
    ).addTo(map);

    marker3 = L.marker([32.873, -117.244])
      .bindTooltip("Suggested location",
          {
            permanent: true,
            direction: 'right'
          }
    ).addTo(map);
}
