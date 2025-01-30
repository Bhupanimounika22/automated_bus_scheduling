document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    setupDateRangePicker();
    setupCustomReportForm();
});

function initializeCharts() {
    createRouteEfficiencyChart();
    createPassengerPatternsChart();
    createResourceUtilizationChart();
}

function createRouteEfficiencyChart() {
    const ctx = document.getElementById('routeEfficiencyChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Route 101', 'Route 202', 'Route 303', 'Route 404', 'Route 505'],
            datasets: [{
                label: 'On-Time Performance (%)',
                data: [92, 88, 95, 85, 90],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
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

function createPassengerPatternsChart() {
    const ctx = document.getElementById('passengerPatternsChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'],
            datasets: [{
                label: 'Weekday',
                data: [20, 80, 40, 30, 35, 75, 85, 40],
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: false
            }, {
                label: 'Weekend',
                data: [10, 30, 45, 55, 60, 50, 40, 35],
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createResourceUtilizationChart() {
    const ctx = document.getElementById('resourceUtilizationChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['In Use', 'Maintenance', 'Idle'],
            datasets: [{
                data: [70, 15, 15],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        }
    });
}

function setupDateRangePicker() {
    $('#dateRange').daterangepicker({
        opens: 'left'
    });
}

function setupCustomReportForm() {
    document.getElementById('customReportForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const reportType = document.getElementById('reportType').value;
        const dateRange = document.getElementById('dateRange').value;
        generateCustomReport(reportType, dateRange);
    });
}

function generateCustomReport(reportType, dateRange) {
     
    console.log(`Generating ${reportType} report for date range: ${dateRange}`);
    alert(`Report generation initiated for ${reportType}. Date range: ${dateRange}`);
}
