 
const map = L.map('map').setView([16.5062, 80.6480], 13);  
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);


 
let routes = [];

 
 

 
const routesList = document.getElementById("routesList");
const routeForm = document.getElementById("routeForm");
const saveRouteBtn = document.getElementById("saveRouteBtn");
const editRouteBtn = document.getElementById("editRouteBtn");
const deleteRouteBtn = document.getElementById("deleteRouteBtn");
const selectAllRoutes = document.getElementById("selectAllRoutes");

let isEditing = false;
let editingRouteIndex = -1;

// Render routes to the table
function renderRoutes() {
  routesList.innerHTML = "";
  routes.forEach((route, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" data-index="${index}" class="routeCheckbox"></td>
      <td>${route.number}</td>
      <td>${route.start}</td>
      <td>${route.end}</td>
      <td>${route.status}</td>
      <td>${route.buses}</td>
    `;
    routesList.appendChild(row);
  });
}

// Save route (add or edit)
saveRouteBtn.addEventListener("click", () => {
  const routeData = {
    number: document.getElementById("routeNumber").value,
    start: document.getElementById("startPoint").value,
    end: document.getElementById("endPoint").value,
    buses: document.getElementById("activeBuses").value,
    status: "Active",
  };

  if (isEditing) {
    routes[editingRouteIndex] = routeData;
    isEditing = false;
    editingRouteIndex = -1;
  } else {
    routes.push(routeData);
  }

  renderRoutes();
  routeForm.reset();
  bootstrap.Modal.getInstance(document.getElementById("routeModal")).hide();
});

// Edit selected route
editRouteBtn.addEventListener("click", () => {
  const selectedCheckboxes = document.querySelectorAll(".routeCheckbox:checked");
  if (selectedCheckboxes.length !== 1) {
    alert("Please select exactly one route to edit.");
    return;
  }

  const index = selectedCheckboxes[0].dataset.index;
  const route = routes[index];

  document.getElementById("routeNumber").value = route.number;
  document.getElementById("startPoint").value = route.start;
  document.getElementById("endPoint").value = route.end;
  document.getElementById("activeBuses").value = route.buses;

  isEditing = true;
  editingRouteIndex = index;

  const routeModal = new bootstrap.Modal(document.getElementById("routeModal"));
  routeModal.show();
});

 
deleteRouteBtn.addEventListener("click", () => {
  const selectedCheckboxes = document.querySelectorAll(".routeCheckbox:checked");
  if (selectedCheckboxes.length === 0) {
    alert("Please select at least one route to delete.");
    return;
  }

  const indicesToDelete = Array.from(selectedCheckboxes).map((checkbox) => parseInt(checkbox.dataset.index));
  routes = routes.filter((_, index) => !indicesToDelete.includes(index));

  renderRoutes();
});


selectAllRoutes.addEventListener("change", (e) => {
  document.querySelectorAll(".routeCheckbox").forEach((checkbox) => {
    checkbox.checked = e.target.checked;
  });
});

// Initial Rendering
renderRoutes();