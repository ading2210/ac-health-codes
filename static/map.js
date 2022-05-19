var map = L.map('map').setView([37.6604, -121.8758], 13);

var marker_click = false;
var markerList = [];

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'map-tiles'
}).addTo(map);

var layer_group = L.layerGroup();
layer_group.addTo(map);

var marker = L.marker([51.5, -0.09]).addTo(map);

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();

  var time = date + ' ' + month + ' ' + year;
  return time;
}

function toTitleCase(value) {
  value = value.toLowerCase().split(' ');
  for (var i = 0; i < value.length; i++) {
    value[i] = value[i].charAt(0).toUpperCase() + value[i].slice(1); 
  }
  return value.join(' ');
}

function pullData(lng, lat, diff) {
  console.log("Fetching data...");
  marker_list = [];
  var query = "location?long=" + String(lng) + "&lat=" + String(lat) + "&diff=" + String(diff) + "&limit=" + String(200);
  
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

        var time = timeConverter(item.attributes.Activity_Date)

        
        var grade = item.attributes.Grade
        if (grade == "G") {
          grade = "Pass";
        } else if (grade == "Y") {
          grade = "Conditional Pass"
        }
        else if (grade == "R") {
          grade = "Closed"
        };
        var popupHTML = (`
          <body>
            <h1>${toTitleCase(item.attributes.Facility_Name)}</h1>
            <b>Address:</b> ${toTitleCase(item.attributes.Address)}<br>
            <b>Inspection date</b>:  ${time}<br>
            <b>Grade</b>:  ${grade}<br>
            <b>Description</b>:  ${item.attributes.Violation_Description}<br>
            <b>More Details:</b><a href="javascript: window.open('/details?id=${item.attributes.Facility_ID}', 'Restaurant Details', 'width=400,height=250')"> Details</a>
          </body>
          `);
        marker.bindPopup(popupHTML);
        markerList.push(marker);
        
        marker.on('click', function(e) {
          marker_click = true;
        });
        markerList.push(marker);
      }
      
    });
}

map.on("moveend", function () {
  if(marker_click == true) {
    marker_click = false;
    return;
  }
  if(marker_click == false) {
    updateMap()
  }
});  

function updateMap() {
  var center = map.getCenter();
  var bounds = map.getBounds()._northEast;
  var diff1 = Math.abs(center.lat-bounds.lat)
  var diff2 = Math.abs(center.lng-bounds.lng)
  var diff = Math.max(diff1, diff2)
  
  layer_group.clearLayers();
  pullData(map.getCenter().lat, map.getCenter().lng, diff)    
}

function openMarker(y, x) {
  map.panTo(new L.LatLng(y, x));
  map.setZoom(15); 
  //updateMap();
  //console.log(markerList);
  //findMarker(name)
}

function findMarker(name) {
  for(var i = 0; i < markerList.length; i++) {
    var item = markerList[i]
    var markerName = item.options.title;

    if(markerName == name) {
      item.openPopup();
      break;
    }
  }
  
}

function search() {
  var text = document.getElementById("search").value;
  var table = document.getElementById("results_table");
  table.innerHTML = "";
  var query = "search?query="+text+"&limit=50";
  $.ajax({
      url: "/api/alameda/" + query,
      type: "GET",
    
    }).done(function(data) {

    if (data.restaurants.length > 0) {

      
      var row;
      var cell;
      var restaurantHTML;
      var restaurant;
      var grade;
      for (let i=0; i<data.restaurants.length; i++) {
        restaurant = data.restaurants[i];
        grade = restaurant.attributes.Grade;
        if (grade === "G" || grade === "g") {
          grade = "Pass";
        } else if (grade === "Y" || grade === "y") {
          grade = "Conditional Pass";
        }
        else if (grade === "R" || grade === "r") {
          grade = "Closed";
        }
        else {
          grade = "Unknown";
        };
        row = table.insertRow(-1);
        cell = row.insertCell(0);
        cell.className = "table_cell";
        cell.innerHTML = (`
        <div> 
          <p style="margin: 0px">${toTitleCase(restaurant.attributes.Facility_Name)}</p>
          <p style="font-size: 12px; margin: 0px">${toTitleCase(restaurant.attributes.Address+", "+restaurant.attributes.City)}</p>
          <p style="font-size: 12px; margin: 0px">Grade: ${grade}</p>
          <p style="font-size: 12px; margin: 0px"><a href="javascript: window.open('/details?id=${restaurant.attributes.Facility_ID}', 'Restaurant Details', 'width=400,height=250')">Details</a> | <a href="javascript: openMarker(${restaurant.geometry.y}, ${restaurant.geometry.x});">Locate On Map</a></p>
          
        </div>
        `);
        
      }
    }
    else {
      var row = table.insertRow(-1);
      var cell = row.insertCell(0);
      cell.innerHTML = "No results found."
    }
  })
}