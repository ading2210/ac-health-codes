
var map = L.map('map').setView([37.6604, -121.8758], 13);

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'map-tiles'
}).addTo(map);

var marker = L.marker([51.5, -0.09]).addTo(map);

function pullData() {
  console.log("Fetching data...");
  $.ajax({
    url: "https://hackathon-again.uniqueostrich18.repl.co/api/alameda/location?long=37.6608268&lat=-121.8753042&diff=10&limit=500",
      type: "GET",
    
  }).done(function(data) {
    var businessData = JSON.parse(data);
    sfRestrauntData = businessData;

    //changed the api to sort by name
    //adding markers to map
    for (var i = 0; i < businessData.length; i++) {
      var item = businessData[i];
      if(item.hasOwnProperty('business_latitude')){
        var marker = L.marker([item.business_latitude, item.business_longitude], {
          title: item.business_name
        }).addTo(map);

        var year = item.inspection_date.split('-')[0]

        if(item.inspection_score === undefined) {
          item.inspection_score = "No Score Available"
        }

        if(item.risk_category === undefined) {
          item.risk_category = "No Rating Available"
        }

        if(item.violation_description === undefined) {
          item.violation_description = "No Description Available"
        }

        
        var popupHTML = (`
          <body>
            <h1>${toTitleCase(item.business_name)}</h1>
            <b>Address:</b> ${toTitleCase(item.business_address)}<br>
            <b>Inspection Year</b>:  ${year}<br>
            <b>Inspection Score</b>: ${item.inspection_score}<br>
            <b>Violation Risk</b>:  ${item.risk_category}<br>
            <b>Violation Type</b>:  ${item.violation_description}<br>
          </body>
          `);
        marker.bindPopup(popupHTML);
        markerList.push(marker);
      }
    }
  });

