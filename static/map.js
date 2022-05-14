var map = L.map('map').setView([37.6604, -121.8758], 13);

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'map-tiles'
}).addTo(map);

var layer_group = L.layerGroup();
layer_group.addTo(map);

var marker = L.marker([51.5, -0.09]).addTo(map);

function pullData(lng, lat, diff) {
  console.log("Fetching data...");
  var query = "location?long=" + String(lng) + "&lat=" + String(lat) + "&diff=" + String(diff) + "&limit=" + String(500);
  
    $.ajax({
      url: "/api/alameda/" + query,
      type: "GET",
    
    }).done(function(data) {
      for (var i = 0; i < data.restaurants.length; i++) {
        var item = data.restaurants[i];
        var marker = L.marker([item.geometry.y, item.geometry.x], {
          title: item.attributes.Facility_Name
        }).addTo(map);
        layer_group.addLayer(marker);
      }
    });


}

var old_lng;
var old_lat;

map.on("moveend", function () {
  var center = map.getCenter();
  var bounds = map.getBounds()._northEast;
  var diff1 = Math.abs(center.lat-bounds.lat)
  var diff2 = Math.abs(center.lng-bounds.lng)
  var diff = Math.max(diff1, diff2)
  if(old_lng == undefined) {
    
    
  } else if(old_lng - map.getCenter().lng >= 0.025 || old_lat - map.getCenter().lat >= 0.025) {
    layer_group.clearLayers();
    pullData(map.getCenter().lat, map.getCenter().lng, diff)    
  } else if(old_lng - map.getCenter().lng <= -0.025 || old_lat - map.getCenter().lat <= -0.025) {
    layer_group.clearLayers();
    pullData(map.getCenter().lat, map.getCenter().lng, diff)
  }
  
  old_lng = map.getCenter().lng;
  old_lat = map.getCenter().lat;
});