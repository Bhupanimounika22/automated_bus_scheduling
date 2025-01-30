const Crew = require('../models/Crew');
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');
const nodemailer = require('nodemailer');
const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate({
        path: 'crewId',
        select: 'fullName role',
      })
      .populate('busId', 'busId');
 
    const convertTo12HourFormat = (time) => {
      if (typeof time !== 'string') {
 
        if (time instanceof Date) {
          time = time.toISOString().slice(11, 16);  
        } else {
          return 'N/A';  
        }
      }
      
      let [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;   
      return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const formattedSchedules = schedules.map(schedule => ({
      id: schedule._id,
      crew: schedule.crewId.map(member => `${member.fullName} (${member.role})`).join(', '),
      bus: schedule.busId ? schedule.busId.busId : 'N/A',
      shift: schedule.shift || 'N/A',
      date: schedule.scheduleDate ? new Date(schedule.scheduleDate).toLocaleDateString() : 'N/A',
      startTime: schedule.startTime ? convertTo12HourFormat(schedule.startTime) : 'N/A',
      endTime: schedule.endTime ? convertTo12HourFormat(schedule.endTime) : 'N/A',
    }));

    res.render('scheduleManagement', { schedules: formattedSchedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).send('Error fetching schedules');
  }
};


 

const sendEmail = async (member, shift, bus, formattedStartTime, formattedEndTime) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'Enter your email',  
      pass: 'Enter your app password'    
    }
  });

  const mailOptions = {
    from: 'bhupanimounika123@gmail.com',  
    to: member.email,  
    subject: 'Your Assigned Shift',
    text: `Hello ${member.fullName},\n\nYou have been assigned to the following shift:\n\nBus: ${bus.busId}\nShift: ${shift}\nStart Time: ${formattedStartTime}\nEnd Time: ${formattedEndTime}\n\nPlease be on time.\n\nBest Regards,\nSchedule Management`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${member.fullName}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const autoAssignSchedules = async (req, res) => {
  try {
    const drivers = await Crew.find({ role: 'Driver' });
    const conductors = await Crew.find({ role: 'Conductor' });
    const buses = await Bus.find();

    if (!drivers.length || !conductors.length || !buses.length) {
      return res.status(400).send('Insufficient resources to generate schedules.');
    }

    const currentDate = new Date();
    const shifts = [
      { shift: 'Shift 1 (6 AM - 2 PM)', startTime: '06:00', endTime: '14:00' },
      { shift: 'Shift 2 (2 PM - 10 PM)', startTime: '14:00', endTime: '22:00' },
    ]; // Only 2 shifts per bus

    const schedules = [];

    const convertTo12HourFormat = (time) => {
      let [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;
      return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const date = new Date(currentDate);

    const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);

    const shuffledBuses = shuffleArray(buses);
    const shuffledDrivers = shuffleArray(drivers);
    const shuffledConductors = shuffleArray(conductors);

    const crewAssignments = {};

    // Delete previous schedules for the current date
    await Schedule.deleteMany({ scheduleDate: date });

    // Assigning shifts to buses and crew members
    let busIndex = 0;
    let driverIndex = 0;
    let conductorIndex = 0;

    while (busIndex < shuffledBuses.length && driverIndex < shuffledDrivers.length && conductorIndex < shuffledConductors.length) {
      const bus = shuffledBuses[busIndex];
      const driver = shuffledDrivers[driverIndex];
      const conductor = shuffledConductors[conductorIndex];

      shifts.forEach(({ shift, startTime, endTime }) => {
        const formattedStartTime = convertTo12HourFormat(startTime);
        const formattedEndTime = convertTo12HourFormat(endTime);

        // If the driver or conductor has already been assigned for the day, skip
        if (crewAssignments[driver._id] || crewAssignments[conductor._id]) {
          return;
        }

        crewAssignments[driver._id] = { busId: bus._id, shift, startTime: formattedStartTime, endTime: formattedEndTime };
        crewAssignments[conductor._id] = { busId: bus._id, shift, startTime: formattedStartTime, endTime: formattedEndTime };

        schedules.push({
          busId: bus._id,
          crewId: [driver._id, conductor._id],
          scheduleDate: date,
          shift,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
        });

        // Send email to both driver and conductor after assigning the shift
        sendEmail(driver, shift, bus, formattedStartTime, formattedEndTime);
        sendEmail(conductor, shift, bus, formattedStartTime, formattedEndTime);

        // Move to the next crew member for the next shift
        driverIndex++;
        conductorIndex++;
      });

      // Move to the next bus for assignment
      busIndex++;
    }

    // Checking if all buses have been assigned with crew
    const totalCrewRequired = shuffledBuses.length * shifts.length * 2; // 2 crew members per bus for each shift
    const totalCrewAssigned = Object.keys(crewAssignments).length;

    if (totalCrewAssigned < totalCrewRequired) {
      return res.status(400).send('Not enough crew members available to cover all buses.');
    }

    // Insert the scheduled assignments into the database
    await Schedule.insertMany(schedules);

    res.send('Schedules have been automatically assigned for the day.');
  } catch (error) {
    console.error('Error assigning schedules:', error);
    res.status(500).send('Error generating schedules.');
  }
};
 
const editScheduleShift = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { shift } = req.body;

    const schedule = await Schedule.findByIdAndUpdate(scheduleId, { shift }, { new: true });

    if (!schedule) {
      return res.status(404).send('Schedule not found');
    }

    res.redirect('/dashboard/schedule');
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).send('Server Error');
  }
};

// Delete schedule logic
const deleteSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findByIdAndDelete(scheduleId);

    if (!schedule) {
      return res.status(404).send('Schedule not found');
    }

    res.status(200).send({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).send('Server Error');
  }
}; 

module.exports = { getSchedules, autoAssignSchedules, editScheduleShift, deleteSchedule };
