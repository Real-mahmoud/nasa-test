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
  console.log(parameter);
  
  const resultBox = document.getElementById("result");
  
  // get input year to use it in visualization
  let dataAsYear=new Date(date).getFullYear()

  resultBox.innerHTML = "Fetching data... Please wait.";

  try {
    // Geocode
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
    const geoData = await geoRes.json();
    
    if(!geoData.length) throw new Error("Location not found");
    const lat = geoData[0].lat;
    const lon = geoData[0].lon;

    // NASA POWER
    const nasaRes = await fetch(`https://power.larc.nasa.gov/api/projection/daily/point?start=${date.replace(/-/g,"")}&end=${date.replace(/-/g,"")}&latitude=${lat}&longitude=${lon}&community=ag&parameters=T2M%2CPRECTOTCORR%2CWS10M&format=json&header=true`);                 
    const nasaData = await nasaRes.json();

    // set iframe with nasa visualization from 10 years before input year to the input year
    let visualizationBox=document.querySelector(".nasa-visualization-box")
    visualizationBox.style.display="flex";
    let iframe=document.querySelector("iframe")
    iframe.src=`https://power.larc.nasa.gov/api/projection/visualization/line?start=${dataAsYear-5}&end=${dataAsYear}&latitude=${lat}&longitude=${lon}&parameter=tmax_annave`;
    
    // set see visualization data for small screens 
    let visBtn=document.querySelector("#see-visualization");
    visBtn.href=`https://power.larc.nasa.gov/api/projection/visualization/line?start=${dataAsYear-5}&end=${dataAsYear}&latitude=${lat}&longitude=${lon}&parameter=tmax_annave`;
    

    const value = nasaData.properties.parameter[parameter][date.replace(/-/g,"")];

    // change rain insight 
    let PRECTOTCORR=nasaData.properties.parameter["PRECTOTCORR"][date.replace(/-/g,"")] + "";
    let max=40;
    counters[0].setAttribute("data-target",Math.ceil((PRECTOTCORR / max) * 100));   

    // avg temp insight 
    counters[1].setAttribute("data-target",nasaData.properties.parameter["T2M"][date.replace(/-/g,"")] + "");
    
    // wind insight 
    counters[2].setAttribute("data-target",nasaData.properties.parameter["WS10M"][date.replace(/-/g,"")] + "");

    // to make it count up from 0 to value
    animateNumbers()

    let unit=nasaData.parameters[parameter].units;
    console.log(unit);
    
    const icon = parameter.includes("WS10M") ? "🌪️" :
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
          updateVisualization(lat, lon);
        } else{
          updateVisualization(lat, lon);
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


// Function to update map & chart
function updateVisualization(lat, lon) {
  // Map update
  map.setView([lat, lon], 13);
  if(marker) marker.remove();
  marker = L.marker([lat, lon]).addTo(map);

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