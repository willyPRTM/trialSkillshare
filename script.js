/** DATA SOURCE */
let SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0Z_9HRlW37XWqUtZ04wxzxLQKPis6koAGiSj2Al7YFuzIRrEJMzwSApxAkNS96G363jonr5_9p6jr/pub?gid=0&single=true&output=csv"
let LAYER_NAME = "Points";

/** WEBMAP CONFIGURATION */
let MAP_CENTER_LAT = -3.141956; // latitude 
let MAP_CENTER_LON = -60.292857; // longitude
let MAP_ZOOM = 13; // zoom level
let MAP_BASEMAP_NAME1 = "Carto Light";
let MAP_BASEMAP_URL1 = "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png";
let MAP_BASEMAP_NAME2 = "Google Sattelite";
let MAP_BASEMAP_URL2 = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";
//let MAP_BASEMAP_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/%7Bz%7D/%7By%7D/%7Bx%7D";
let MAP_LEGEND_POSITION = "topleft";
let MAP_ZOOM_CONTROLS_POSITION = "topright";

/** Fill in these values to use Mapbox Studio basemaps */
//"pk.eyJ1IjoiZm9yZXN0cmVzZWFyY2htYXBwaW5nIiwiYSI6ImNsZTNvYjk5NjA0a3Uzd3FvMDJiMDJ3NHQifQ.n0JfCKGTnky_isyx8dEFeg";
//let MAPBOX_STYLE = "mapbox://styles/forestresearchmapping/clhii8rqr02uq01p4a129258b";


/** Calling this functions to create our map */
/** DON'T REMOVE */
createMap();
addLayerControls();

/** Adding map basemaps */
addBasemap(MAP_BASEMAP_URL1, MAP_BASEMAP_NAME1);
addBasemap(MAP_BASEMAP_URL2, MAP_BASEMAP_NAME2);
//addMapboxBasemap(MAPBOX_STYLE, 'OSM Mapbox');

/** Calling a function which loads and adds a new google layer */
addGoogleSpreadsheet(SPREADSHEET_URL, LAYER_NAME);
//addGeoJSON("Track Trial.geojson", "Track");

/** Calling a function which adds a custom GeoJSON file */
addGeoJSON("Track Trial.geojson", {
  "color": "#66cc00", // border color
  "opacity": 0.8, // border transparency
  "weight": 3, // border width
  "fillColor": "blue", // inner polygon color
  "fillOpacity": 0 // inner polygon transparency
});















/** COMPLEX CODE BELOW :) */
// Initialize the map and assign it to a variable for later use
function createMap() {
  map = L.map("map", {
    center: [MAP_CENTER_LAT, MAP_CENTER_LON],
    zoom: MAP_ZOOM,
    zoomControl: false
  });
}

// Adding layer control
function addLayerControls() {
  let layerControlButton = L.Control.extend({
    options: { position: MAP_LEGEND_POSITION },
    onAdd: function (map) {
      let container = L.DomUtil.create('input');
      container.type = 'button';
      container.className = 'layer-control-open';
      container.onclick = function() {
        document.querySelector('.leaflet-control-layers').style.display = 'block';
        document.querySelector('.layer-control-open').style.display = 'none';
      }
      return container;
    }
  });
  map.addControl(new layerControlButton());
  
  // mofidying layer control
  L.Control.Custom = L.Control.Layers.extend({
    onAdd: function () {
      this._initLayout();
      this._addButton();
      this._update();
      return this._container;
    },
    _addButton: function () {
      let elements = this._container.getElementsByClassName('leaflet-control-layers-list');
      let button = L.DomUtil.create('button', 'layer-control-close', elements[0]);
      L.DomEvent.on(button, 'click', function(e){
        document.querySelector('.leaflet-control-layers').style.display = 'none';
        document.querySelector('.layer-control-open').style.display = 'block';
      }, this);
    }
  });
  layerControl = new L.Control.Custom({}, {}, {
    collapsed: false,
    position: MAP_LEGEND_POSITION
  }).addTo(map);
}

// add zoom controls
L.control.zoom({ position: MAP_ZOOM_CONTROLS_POSITION }).addTo(map);

/** 
  Add XYZ or Mapbox basemaps
*/
function addBasemap(url, layerName) {
  let basemap = new L.tileLayer(url);

  if (isFirst()) basemap.addTo(map);
  
  layerControl.addBaseLayer(basemap, layerName);
}
function addMapboxBasemap(style, name) {
  let mapboxLayer = L.mapboxGL({
    accessToken: MAPBOX_TOKEN, style: style
  })

  if (isFirst()) mapboxLayer.addTo(map);
  
  layerControl.addBaseLayer(mapboxLayer, name);
}

function isFirst() {
  return (layerControl._layers.filter(el => !el.overlay).length === 0);
}

/** 
  Load data from the google spreadsheet and
  add it to our map
*/
function addGoogleSpreadsheet(url, layerName) {
  Papa.parse(url, {
    header: true,
    download: true,
    complete: function(results) {
      let features = results.data.map(el => {
        return {
          "type": "Feature",
          "properties": { ...el },
          "geometry": {
            "coordinates": [el.longitude, el.latitude],
            "type": "Point"
          }
        }
      });
      let geojson = {
        "type": "FeatureCollection",
        "features": features
      };

      let icon = L.divIcon({
        className: "map-icon",
        html: `<div></div>`
      });
      let layer = new L.geoJSON(geojson, {
        pointToLayer: function(feature, latlng) {
          return L.marker(latlng, { icon: icon })
        },
        onEachFeature: function(feature, layer) {
          let content = popupContent(feature.properties);
          layer.bindPopup(content);
        }
      }).addTo(map);
      layerControl.addOverlay(layer, layerName);
    }
  });
}

/** 
  Add a custom geojson file
*/
function addGeoJSON(fileName, style) {
  fetch(fileName).then(r => r.json()).then(data => {
    L.geoJSON(data, {
      style: style
    }).addTo(map);
  })
}

// create popup content
function popupContent(properties) {
  let html = Object.entries(properties).map(([column, value]) => {
    if (isImage(value)) {
      return `<img style="width:100%;" src="${value}"/>`;
    }
    return "<strong>" + column + ":</strong> " + value + "</br>";
  }).join("");
  return html;
}

function isImage(url) {
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
}

// instanciate new modal
let modal = new tingle.modal({
  footer: false,
  stickyFooter: false,
  closeMethods: ['overlay', 'button', 'escape'],
  closeLabel: "Close",
  cssClass: ['custom-class-1', 'custom-class-2'],
  beforeClose: function() {
    return true; // close the modal
  }
});
document.querySelector('#learn-more').onclick = () => {
  let title = document.querySelector('#modal');
  modal.setContent(title.innerHTML);
  modal.open();
}