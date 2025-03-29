const Crew = require('../models/Crew');
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const ADMIN_EMAIL = 'admin@example.com';  

const sendEmail = async (member, shift, bus, scheduleId, formattedStartTime, formattedEndTime) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'enter the mail ',
      pass: 'password', 
    },
  });

  const acceptUrl = `http://localhost:5090/dashboard/schedule/accept/${scheduleId}/${member._id}/yes`;
  const declineUrl = `http://localhost:5090/dashboard/schedule/accept/${scheduleId}/${member._id}/no`;

  const mailOptions = {
    from: 'enter the mail',
    to: member.email,
    subject: 'Your Assigned Shift - Confirm Within 1 Hour',
    html: `
      Hello ${member.fullName},<br><br>
      You have been assigned to the following shift:<br><br>
      Bus: ${bus.busId}<br>
      Shift: ${shift}<br>
      Start Time: ${formattedStartTime}<br>
      End Time: ${formattedEndTime}<br><br>
      Please confirm your availability:<br>
      <a href="${acceptUrl}">Yes</a> | <a href="${declineUrl}">No</a><br><br>
      If you do not respond within 1 hour before the shift, it may be reassigned.<br><br>
      Best Regards,<br>
      Schedule Management
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${member.fullName}: ${info.response}`);
  } catch (error) {
    console.error(`Error sending email to ${member.email}:`, error.message);
  }
};

const sendAdminNotification = async (member, shift, bus, scheduleId, response) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'enter your mail',
      pass: 'password',
    },
  });

  const mailOptions = {
    from: 'enter mail',
    to: ADMIN_EMAIL,
    subject: `Crew Response: ${response ? 'Accepted' : 'Declined'}`,
    text: `
      Crew Member: ${member.fullName} (${member.role})
      Bus: ${bus.busId}
      Shift: ${shift}
      Schedule ID: ${scheduleId}
      Response: ${response ? 'Yes' : 'No'}
      
      Please reassign if necessary.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Admin notified: ${info.response}`);
  } catch (error) {
    console.error(`Error notifying admin:`, error.message);
  }
};

const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate({ path: 'crewId', select: 'fullName role' })
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

    const formattedSchedules = schedules.map((schedule) => ({
      id: schedule._id,
      crew: schedule.crewId.map((member, idx) => `${member.fullName} (${member.role}) [${schedule.accepted[idx] === null ? 'Pending' : schedule.accepted[idx] ? 'Accepted' : 'Declined'}]`).join(', '),
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

const assignSchedules = async (sendEmails = false) => {
  try {
    const drivers = await Crew.find({ role: 'Driver' });
    const conductors = await Crew.find({ role: 'Conductor' });
    const buses = await Bus.find();

    if (!buses.length) throw new Error('No buses available.');

    const shifts = [
      { shift: 'Shift 1 (6 AM - 2 PM)', startTime: '06:00', endTime: '14:00' },
      { shift: 'Shift 2 (2 PM - 10 PM)', startTime: '14:00', endTime: '22:00' },
      { shift: 'Shift 3 (10 PM - 6 AM)', startTime: '22:00', endTime: '06:00' },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);  

    await Schedule.deleteMany({ scheduleDate: today });
    console.log('Cleared schedules for today');

    const schedules = [];
    const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const convertTo12HourFormat = (time) => {
      let [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const isAvailable = (entityId, date, startTime, endTime, existingSchedules) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      return !existingSchedules.some((s) => {
        if (s.scheduleDate.toDateString() !== date.toDateString()) return false;
        const sStart = timeToMinutes(s.startTime.split(' ')[0]);
        const sEnd = timeToMinutes(s.endTime.split(' ')[0]);
        return (
          (s.crewId.includes(entityId) || s.busId.equals(entityId)) &&
          (sStart <= endMinutes && sEnd >= startMinutes)
        );
      });
    };

    const shuffledBuses = shuffleArray([...buses]);
    const shuffledDrivers = shuffleArray([...drivers]);
    const shuffledConductors = shuffleArray([...conductors]);

    let driverIndex = 0;
    let conductorIndex = 0;

    for (const shift of shifts) {
      for (const bus of shuffledBuses) {
        const driver = driverIndex < shuffledDrivers.length ? shuffledDrivers[driverIndex] : null;
        const conductor = conductorIndex < shuffledConductors.length ? shuffledConductors[conductorIndex] : null;

        if (!driver || !conductor) break;

        const formattedStartTime = convertTo12HourFormat(shift.startTime);
        const formattedEndTime = convertTo12HourFormat(shift.endTime);

        if (
          isAvailable(bus._id, today, shift.startTime, shift.endTime, schedules) &&
          isAvailable(driver._id, today, shift.startTime, shift.endTime, schedules) &&
          isAvailable(conductor._id, today, shift.startTime, shift.endTime, schedules)
        ) {
          const schedule = new Schedule({
            busId: bus._id,
            crewId: [driver._id, conductor._id],
            accepted: [null, null], // Pending for driver and conductor
            scheduleDate: today,
            shift: shift.shift,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
          });
          schedules.push(schedule);

          driverIndex++;
          conductorIndex++;
        }
      }
    }

    await Schedule.insertMany(schedules);
    console.log(`Generated ${schedules.length} schedules for ${today.toLocaleDateString()}`);

    if (sendEmails) {
      schedules.forEach(async (schedule) => {
        const [driverId, conductorId] = schedule.crewId;
        const driver = drivers.find(d => d._id.equals(driverId));
        const conductor = conductors.find(c => c._id.equals(conductorId));
        const bus = buses.find(b => b._id.equals(schedule.busId));

        await sendEmail(driver, schedule.shift, bus, schedule._id, schedule.startTime, schedule.endTime);
        await sendEmail(conductor, schedule.shift, bus, schedule._id, schedule.startTime, schedule.endTime);
      });
    }
  } catch (error) {
    console.error('Error assigning schedules:', error);
    throw error;
  }
};

const autoAssignSchedules = async (req, res) => {
  try {
    await assignSchedules(true);
    res.send('Schedules assigned for today.');
  } catch (error) {
    res.status(500).send('Error assigning schedules');
  }
};

const acceptSchedule = async (req, res) => {
  const { scheduleId, crewId, response } = req.params;
  const accept = response === 'yes';

  try {
    const schedule = await Schedule.findById(scheduleId)
      .populate('crewId')
      .populate('busId');
    if (!schedule) return res.status(404).send('Schedule not found');

    const crewIndex = schedule.crewId.findIndex(id => id._id.equals(crewId));
    if (crewIndex === -1) return res.status(400).send('Crew member not in schedule');

    schedule.accepted[crewIndex] = accept;
    await schedule.save();

    const member = schedule.crewId[crewIndex];
    await sendAdminNotification(member, schedule.shift, schedule.busId, scheduleId, accept);

    res.send(`Schedule ${accept ? 'accepted' : 'declined'}. Admin has been notified.`);
  } catch (error) {
    console.error('Error processing acceptance:', error);
    res.status(500).send('Server Error');
  }
};

// Daily scheduling at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily schedule assignment...');
  assignSchedules(false);
});

// Email reminders 1 hour before shift
cron.schedule('0 * * * *', async () => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const schedules = await Schedule.find({
    scheduleDate: { $gte: now, $lte: oneHourLater },
    accepted: { $in: [null] },
  }).populate('busId').populate('crewId');

  schedules.forEach(async (schedule) => {
    const [driver, conductor] = schedule.crewId;
    if (schedule.accepted[0] === null) await sendEmail(driver, schedule.shift, schedule.busId, schedule._id, schedule.startTime, schedule.endTime);
    if (schedule.accepted[1] === null) await sendEmail(conductor, schedule.shift, schedule.busId, schedule._id, schedule.startTime, schedule.endTime);
  });
});

const editScheduleShift = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { shift } = req.body;
    const schedule = await Schedule.findByIdAndUpdate(scheduleId, { shift }, { new: true });
    if (!schedule) return res.status(404).send('Schedule not found');
    res.redirect('/dashboard/schedule');
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).send('Server Error');
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findByIdAndDelete(scheduleId);
    if (!schedule) return res.status(404).send('Schedule not found');
    res.status(200).send({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).send('Server Error');
  }
};

 
const getDashboardData = async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeSchedules = await Schedule.find({
      scheduleDate: { $gte: new Date().setHours(0, 0, 0, 0) },
      accepted: { $nin: [false] },  
    }).populate('crewId');
    const onDutyCrew = new Set(activeSchedules.flatMap(s => s.crewId.map(c => c._id.toString()))).size;

    res.render('dashboard', {
      totalBuses,
      onDutyCrew,
      activeRoutes: 0,  
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Error loading dashboard');
  }
};

module.exports = { getSchedules, autoAssignSchedules, editScheduleShift, deleteSchedule, acceptSchedule, getDashboardData };