// ===============================
// 1. MAP INITIALIZATION
// ===============================
const map = L.map('map').setView([22.5, 79], 5);

const baseLayer = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap contributors' }
).addTo(map);

// ===============================
// 2. WIND ZONE COLORS (FINAL)
// ===============================
const windZoneColors = {
  wind_zone_33: "#bfd7ea",
  wind_zone_39: "#9ad1c3",
  wind_zone_44: "#8fb996",
  wind_zone_47: "#c3c98a",
  wind_zone_50: "#e6c77a",
  wind_zone_55: "#c97b63"
};

// ===============================
// 3. ZONE → m/s (FINAL FIX)
// ===============================
const zoneToMps = {
  wind_zone_33: 33,
  wind_zone_39: 39,
  wind_zone_44: 44,
  wind_zone_47: 47,
  wind_zone_50: 50,
  wind_zone_55: 55
};

let windLayer;
let clickMarker;
let lastResult = null;

// ===============================
// 4. LOAD GEOJSON
// ===============================
fetch("data/wind_zones_india_nbc_2016.geojson")
  .then(res => res.json())
  .then(data => {

    windLayer = L.geoJSON(data, {
      style: feature => ({
        fillColor: windZoneColors[feature.properties.zone_name],
        color: "#000",
        weight: 1,
        fillOpacity: 0.6
      }),
      onEachFeature: (feature, layer) => {
        const zone = feature.properties.zone_name;
        const wind = zoneToMps[zone];

        layer.bindPopup(`
          <b>Wind Zone:</b> ${zone}<br>
          <b>Wind Speed:</b> ${wind} m/s<br>
          <b>Standard:</b> ${feature.properties.standard}
        `);
      }
    }).addTo(map);

    // ===============================
    // 5. LAYER TOGGLE
    // ===============================
    L.control.layers(
      { "OpenStreetMap": baseLayer },
      { "Wind Zones (IS 875 : Part 3)": windLayer }
    ).addTo(map);

  });

// ===============================
// 6. CLICK → AUTO DETECT ZONE
// ===============================
map.on("click", e => detectWindZone(e.latlng));

function detectWindZone(latlng) {

  if (clickMarker) map.removeLayer(clickMarker);

  windLayer.eachLayer(layer => {
    if (layer.getBounds().contains(latlng)) {

      const zone = layer.feature.properties.zone_name;
      const wind = zoneToMps[zone];

      lastResult = {
        zone,
        wind,
        standard: layer.feature.properties.standard,
        lat: latlng.lat.toFixed(5),
        lon: latlng.lng.toFixed(5)
      };

      clickMarker = L.marker(latlng).addTo(map)
        .bindPopup(`
          <b>Wind Zone:</b> ${zone}<br>
          <b>Wind Speed:</b> ${wind} m/s<br>
          <b>Standard:</b> ${lastResult.standard}<br>
          <b>Latitude:</b> ${lastResult.lat}<br>
          <b>Longitude:</b> ${lastResult.lon}
        `).openPopup();
    }
  });
}

// ===============================
// 7. SEARCH BY CITY
// ===============================
function searchCity() {
  const city = document.getElementById("cityInput").value;
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) return alert("City not found");
      const latlng = L.latLng(data[0].lat, data[0].lon);
      map.setView(latlng, 8);
      detectWindZone(latlng);
    });
}

// ===============================
// 8. SEARCH BY COORDINATES
// ===============================
function searchCoordinates() {
  const val = document.getElementById("coordInput").value.split(",");
  if (val.length !== 2) return alert("Invalid coordinates");
  const latlng = L.latLng(parseFloat(val[0]), parseFloat(val[1]));
  map.setView(latlng, 8);
  detectWindZone(latlng);
}

// ===============================
// 9. LEGEND (FINAL)
// ===============================
const legend = L.control({ position: "bottomright" });

legend.onAdd = () => {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = `
    <h4>Wind Zones (IS 875 : Part 3)</h4>
    <div><span style="background:#bfd7ea"></span>Zone 33 – 33 m/s</div>
    <div><span style="background:#9ad1c3"></span>Zone 39 – 39 m/s</div>
    <div><span style="background:#8fb996"></span>Zone 44 – 44 m/s</div>
    <div><span style="background:#c3c98a"></span>Zone 47 – 47 m/s</div>
    <div><span style="background:#e6c77a"></span>Zone 50 – 50 m/s</div>
    <div><span style="background:#c97b63"></span>Zone 55 – 55 m/s</div>
  `;
  return div;
};

legend.addTo(map);

// ===============================
// 10. PDF REPORT (FINAL)
// ===============================
function downloadPDF() {
  if (!lastResult) return alert("Select a location first");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(16);
  pdf.text("NBC Wind Zone Report", 10, 15);

  pdf.setFontSize(12);
  pdf.text(`Wind Zone: ${lastResult.zone}`, 10, 30);
  pdf.text(`Basic Wind Speed: ${lastResult.wind} m/s`, 10, 40);
  pdf.text(`Standard: ${lastResult.standard}`, 10, 50);
  pdf.text(`Latitude: ${lastResult.lat}`, 10, 60);
  pdf.text(`Longitude: ${lastResult.lon}`, 10, 70);

  pdf.save("NBC_Wind_Zone_Report.pdf");
}
