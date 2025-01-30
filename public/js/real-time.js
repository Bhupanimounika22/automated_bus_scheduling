let map;
let busMarkers = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    updateBusStatus();
    updateDelayNotifications();
    updatePassengerLoadChart();
    setInterval(simulateRealTimeUpdates, 5000); // Update every 5 seconds
});

function initializeMap() {
    map = L.map('map').setView([16.5062, 80.6480], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}


function updateBusStatus() {
    const busStatusList = document.getElementById('busStatusList');
    busStatusList.innerHTML = '';
    const buses = [
        { id: 'Bus001', route: '101', status: 'On Time' },
        { id: 'Bus002', route: '202', status: 'Delayed' },
        { id: 'Bus003', route: '303', status: 'On Time' }
    ];

    buses.forEach(bus => {
        const listItem = document.createElement('li');
        listItem.className = `list-group-item d-flex justify-content-between align-items-center ${bus.status === 'Delayed' ? 'list-group-item-warning' : ''}`;
        listItem.innerHTML = `
            ${bus.id} - Route ${bus.route}
            <span class="badge bg-primary rounded-pill">${bus.status}</span>
        `;
        busStatusList.appendChild(listItem);

        // Add or update bus marker on the map
        if (!busMarkers[bus.id]) {
            busMarkers[bus.id] = L.marker([51.505 + Math.random() * 0.1 - 0.05, -0.09 + Math.random() * 0.1 - 0.05])
                .addTo(map)
                .bindPopup(`${bus.id} - Route ${bus.route}`);
        } else {
            busMarkers[bus.id].setLatLng([51.505 + Math.random() * 0.1 - 0.05, -0.09 + Math.random() * 0.1 - 0.05]);
        }
    });
}

function updateDelayNotifications() {
    const delayNotificationsList = document.getElementById('delayNotificationsList');
    delayNotificationsList.innerHTML = '';
    const notifications = [
        { route: '101', delay: '5 minutes', reason: 'Traffic congestion' },
        { route: '202', delay: '10 minutes', reason: 'Road work' }
    ];

    notifications.forEach(notification => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.innerHTML = `
            <strong>Route ${notification.route}:</strong> Delayed by ${notification.delay}<br>
            <small>Reason: ${notification.reason}</small>
        `;
        delayNotificationsList.appendChild(listItem);
    });
}

function updatePassengerLoadChart() {
    const ctx = document.getElementById('passengerLoadChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Route 101', 'Route 202', 'Route 303'],
            datasets: [{
                label: 'Current Passenger Load',
                data: [65, 40, 80],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function simulateRealTimeUpdates() {
    updateBusStatus();
    updateDelayNotifications();
    // For a real application, you would fetch this data from a server
}

