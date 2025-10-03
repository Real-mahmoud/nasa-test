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
    const nasaRes = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameter}&community=RE&longitude=${lon}&latitude=${lat}&start=${date.replace(/-/g,"")}&end=${date.replace(/-/g,"")}&format=JSON`);
    const nasaData = await nasaRes.json();
    console.log(nasaRes);
    console.log(nasaData);
    let marker;
    if (marker) {
      marker.remove()
    }
    marker = L.marker([lat, lon]).addTo(map);
    map.setView([lat, lon],13)


    const value = nasaData.properties.parameter[parameter][date.replace(/-/g,"")];

     const icon = parameter.toLowerCase().includes("rain") ? "🌧️" :
      parameter.toLowerCase().includes("temp") ? "☀️" : "📊";

    resultBox.innerHTML = `<strong>${parameter}</strong> on ${date} at ${location}: <br> <span style="color:#9c5ad1">${value} ${icon}</span>`;
    
    updateVisualization(lat, lon, parameter, [date], [value]);

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
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Rainfall Probability',
      data: [],
      borderColor: '#9c5ad1',
      backgroundColor: 'rgba(156,90,209,0.3)',
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
  map.setView([lat, lon], 7);
  if(marker) marker.remove();
  marker = L.marker([lat, lon]).addTo(map);

  // Chart update
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.data.datasets[0].label =
  /*  chartType === "rain" ? "Rainfall Probability" :
    chartType === "temp" ? "Temperature Variation" :
    "Trends Over Years";
  chart.update();*/
  chartType.toLowerCase().includes("rain") ? "Rainfall Probability" :
      chartType.toLowerCase().includes("temp") ? "Temperature Variation" :
        "Trends Over Years";
  chart.update();
}

// Tab switching 
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Example fake data
    const type = btn.dataset.chart;
    if(type === "rain"){
      updateVisualization(30,31,"rain",["Mon","Tue","Wed"],[20,60,40]);
    } else if(type === "temp"){
      updateVisualization(30,31,"temp",["Morning","Noon","Night"],[18,30,22]);
    } else {
      updateVisualization(30,31,"trend",["2021","2022","2023"],[25,27,26]);
    }
  });
});

// Count-up animation
const counters = document.querySelectorAll('.number');

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