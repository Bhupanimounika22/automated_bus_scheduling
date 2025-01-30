document.addEventListener('DOMContentLoaded', function () {
    // Simulate real-time updates
    setInterval(updateDashboard, 5000);

    // Save route logic
    const saveRouteBtn = document.getElementById('saveRouteBtn');
    saveRouteBtn.addEventListener('click', function () {
        const routeNumber = document.getElementById('routeNumber').value;
        const startPoint = document.getElementById('startPoint').value;
        const endPoint = document.getElementById('endPoint').value;

        if (routeNumber && startPoint && endPoint) {
            // alert(Route Created: \nRoute Number: ${routeNumber}\nStart Point: ${startPoint}\nEnd Point: ${endPoint});
            // Reset form fields
            document.getElementById('routeForm').reset();
            // Close modal
            const routeModal = bootstrap.Modal.getInstance(document.getElementById('routeModal'));
            routeModal.hide();
        } else {
            alert('Please fill in all fields.');
        }
    });

    // Save Crew Member
    const saveCrewBtn = document.getElementById('saveCrewBtn');
    saveCrewBtn.addEventListener('click', function () {
        const crewMemberName = document.getElementById('crewMemberName').value;
        const crewMemberPosition = document.getElementById('crewMemberPosition').value;
        const shiftDate = document.getElementById('shiftDate').value;
        const shiftStart = document.getElementById('shiftStart').value;
        const shiftEnd = document.getElementById('shiftEnd').value;
        const crewAadhaar = document.getElementById('crewAadhaar').value;
        const crewPhone = document.getElementById('crewPhone').value;

        if (
            crewMemberName &&
            crewMemberPosition &&
            shiftDate &&
            shiftStart &&
            shiftEnd &&
            crewAadhaar &&
            crewPhone
        ) {
            // Prepare crew member object
            const crewData = {
                name: crewMemberName,
                position: crewMemberPosition,
                date: shiftDate,
                start: shiftStart,
                end: shiftEnd,
                aadhaar: crewAadhaar,
                phone: crewPhone,
            };

            // Save to local storage
            let crewList = JSON.parse(localStorage.getItem('crewList')) || [];
            crewList.push(crewData);
            localStorage.setItem('crewList', JSON.stringify(crewList));

            alert('Crew Member Added Successfully!');
            document.getElementById('shiftAssignmentForm').reset();

            // Close modal
            const addCrewModal = bootstrap.Modal.getInstance(document.getElementById('addCrewModal'));
            addCrewModal.hide();
        } else {
            alert('Please fill in all fields.');
        }
    });

    const mapModal = document.getElementById('mapModal');
    const modalDialog = mapModal.querySelector('.modal-dialog');
    const minimizeButton = document.querySelector('.btn-minimize');
    const maximizeButton = document.querySelector('.btn-maximize');

    minimizeButton.addEventListener('click', function () {
        modalDialog.classList.remove('modal-dialog-fullscreen');
        modalDialog.classList.add('modal-lg'); // Switch back to normal modal size
    });

    maximizeButton.addEventListener('click', function () {
        modalDialog.classList.add('modal-dialog-fullscreen'); // Add fullscreen class
    });
});

 