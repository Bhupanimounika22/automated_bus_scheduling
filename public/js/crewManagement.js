function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
  }

  function deleteCrew(crewId) {
    fetch(`/crew/${crewId}`, { method: 'DELETE' })
    .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert( 'Crew deleted successfully!');
          location.reload();  
        } else {
          alert(data.message);
        }
      })
      .catch(error => console.error('Error:', error));
  }
  
  function deleteBus(busId) {
    fetch(`/bus/${busId}`, { method: 'DELETE' })
    .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          alert('Bus deleted successfully!');
          location.reload();  
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while trying to delete the bus.');
      });
  }
  
  
   
  let crewPage = 1;
  let busPage = 1;
  const rowsPerPage = 5;  // Set how many rows per page you want
  
  // Function to change the page
  function changePage(type, direction) {
    if (type === 'crew') {
      if (direction === 'next') {
      crewPage++;
      } else if (direction === 'prev') {
        crewPage--;
      }
      renderCrewTable();
    } else if (type === 'bus') {
      if (direction === 'next') {
        busPage++;
      } else if (direction === 'prev') {
        busPage--;
      }
      renderBusTable();
    }
  }
  
  // Function to render Crew Table with pagination
  function renderCrewTable() {
    const crewRows = document.querySelectorAll('#crewTableBody tr');
    const totalRows = crewRows.length;
    const start = (crewPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
  
    // Hide all rows
    crewRows.forEach(row => row.style.display = 'none');
  
    // Show rows for the current page
    for (let i = start; i < end && i < totalRows; i++) {
      crewRows[i].style.display = '';
    }
  }
  // Function to render Bus Table with pagination
 // Function to render Bus Table with pagination
 function renderBusTable() {
  const busRows = document.querySelectorAll('#busTableBody tr');
  const totalRows = busRows.length;
  const start = (busPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  // Hide all rows
  busRows.forEach(row => row.style.display = 'none');

  // Show rows for the current page
  for (let i = start; i < end && i < totalRows; i++) {
    busRows[i].style.display = '';
  }
}
  
  // Initialize the tables when the page loads
  document.addEventListener('DOMContentLoaded', function () {
    renderCrewTable();
    renderBusTable();
  });
  function filterCrew() {
    const filterValue = document.getElementById('crewFilter').value.toLowerCase();
    const crewRows = document.querySelectorAll('#crewTableBody tr');

    crewRows.forEach(row => {
      const fullName = row.cells[0].textContent.toLowerCase();
      const role = row.cells[1].textContent.toLowerCase();
      const uniqueId = row.cells[2].textContent.toLowerCase();

      if (fullName.includes(filterValue) || role.includes(filterValue) || uniqueId.includes(filterValue)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
  function filterBus() {
    const filterValue = document.getElementById('busFilter').value.toLowerCase();
    const rows = document.querySelectorAll('#busTableBody tr');
    const filteredRows = [];
  
    rows.forEach(row => {
      const busId = row.cells[0].innerText.toLowerCase();
      const busType = row.cells[1].innerText.toLowerCase();
      const busModel = row.cells[2].innerText.toLowerCase(); // assuming there's a bus model column
  
      // Add more columns here if necessary
      if (
        busId.includes(filterValue) ||
        busType.includes(filterValue) ||
        busModel.includes(filterValue)
      ) {
        row.style.display = '';
        filteredRows.push(row);
      } else {
        row.style.display = 'none';
      }
    });
  }
 
  function redirectToEditPage(crewId) {
    window.location.href = `/dashboard/edit-crew/${crewId}`;
}

function redirectToEditBusPage(busId) {
    window.location.href = `/dashboard/edit-bus/${busId}`;
}

 
