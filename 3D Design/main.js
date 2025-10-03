// Get the button
const scrollTopBtn = document.getElementById("scrollTopBtn");

if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


// add the toggle menu when responsive
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("nav");

menuToggle.addEventListener("click", () => {
nav.classList.toggle("show");
});

// insights counters
const counters = document.querySelectorAll('.number');

document.getElementById("dataForm").addEventListener("submit", async function(e){
  e.preventDefault();

  const location = document.getElementById("location").value;
  const date = document.getElementById("date").value;
  const parameter = document.getElementById("parameter").value;
  const resultBox = document.getElementById("result");

  resultBox.innerHTML = "Fetching data... Please wait.";

  try {
    // Geocode
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
    const geoData = await geoRes.json();
    console.log(geoRes);
    console.log(geoData);
    
    if(!geoData.length) throw new Error("Location not found");
    const lat = geoData[0].lat;
    const lon = geoData[0].lon;

    // NASA POWER
    const nasaRes = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M%2CWS2M%2CPRECTOTCORR&community=RE&longitude=${lon}&latitude=${lat}&start=${date.replace(/-/g,"")}&end=${date.replace(/-/g,"")}&format=JSON`);
    const nasaData = await nasaRes.json();
    console.log(nasaRes);
    console.log(nasaData);

    const value = nasaData.properties.parameter[parameter][date.replace(/-/g,"")];

    // change rain insight 
    let PRECTOTCORR=nasaData.properties.parameter["PRECTOTCORR"][date.replace(/-/g,"")] + "";
    let max=40;
    counters[0].setAttribute("data-target",Math.ceil((PRECTOTCORR / max) * 100));   

    // avg temp insight 
    counters[1].setAttribute("data-target",nasaData.properties.parameter["T2M"][date.replace(/-/g,"")] + "");
    // wind insight 
    counters[2].setAttribute("data-target",nasaData.properties.parameter["WS2M"][date.replace(/-/g,"")] + "");

    // to make it count up from 0 to value
    animateNumbers()

    let unit=nasaData.parameters[parameter].units;
    console.log(unit);
    
    const icon = parameter.includes("WS2M") ? "📊" :
    parameter.includes("T2M") ? "☀️" : "🌧️";
    
    resultBox.innerHTML = `<strong>${parameter}</strong> on ${date} at ${location}: <br> <span style="color:#9c5ad1">${value} ${unit} ${icon}</span>`;
    
    updateVisualization(lat, lon, parameter, [date], [value]);
   
    // Tab chart switching 
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const type = btn.dataset.chart;
        if(type === "rain"){
          updateVisualization(lat, lon,"rain",["min",date,"max"],[0,Math.ceil((PRECTOTCORR / max) * 100),max]);
        } else if(type === "temp"){
          updateVisualization(lat, lon,"temp",["Morning","Noon","Night"],[18,30,22]);
        } else {
          updateVisualization(lat, lon,"trend",["2021","2022","2023"],[25,27,26]);
        }
      });
    });

  } catch(err) {
    resultBox.innerHTML = `<span style="color:red;">❌ Error: ${err.message}</span>`;
  }
});


// Initialize Leaflet Map
const map = L.map('map').setView([30, 31], 5); // default Egypt
L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=5ss5yFCq4GDeUWDijeEi', {
  attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
}).addTo(map);
let marker;

// Initialize Chart.js
const ctx = document.getElementById('vizChart').getContext('2d');
let chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Rainfall Probability',
      data: [],
      borderColor: '#9c5ad1',
      backgroundColor: ['rgba(156,90,209,0.3)' ,'rgba(156,90,209,0.3)','rgba(169, 43, 43, 1)'],
      fill: true,
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Date' }},
      y: { title: { display: true, text: 'Value' }}
    }
  }
});

// Function to update map & chart
function updateVisualization(lat, lon, chartType, labels, data) {
  // Map update
  map.setView([lat, lon], 13);
  if(marker) marker.remove();
  marker = L.marker([lat, lon]).addTo(map);

  // Chart update
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.data.datasets[0].label =
  chartType.toLowerCase().includes("rain") ? "Rainfall Probability" :
      chartType.toLowerCase().includes("temp") ? "Temperature Variation" :
        "Trends Over Years";
  chart.update();
}


const animateNumbers = () => {
  counters.forEach(counter => {
    counter.innerText = "0";
    const updateCounter = () => {
      const target = +counter.getAttribute("data-target");
      const current = +counter.innerText;
      const increment = target / 100; // speed
      if(current < target){
        counter.innerText = `${Math.ceil(current + increment)}`;
        setTimeout(updateCounter, 25);
      } else {
        counter.innerText = target;
      }
    };
    updateCounter();
  });
};

// Trigger when section is visible
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      animateNumbers();
      observer.disconnect(); // run once
    }
  });
}, { threshold: 0.5 });

observer.observe(document.querySelector("#insights"));