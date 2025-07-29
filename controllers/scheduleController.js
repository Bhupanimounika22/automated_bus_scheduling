const Crew = require('../models/Crew');
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const ADMIN_EMAIL = 'admin@example.com';  

const sendEmail = async (member, shift, bus, scheduleId, formattedStartTime, formattedEndTime) => {
  try {
    console.log(`Attempting to send email to ${member.fullName} (${member.email})`);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bhupanimounika123@gmail.com',
        pass: 'agsa fgui rksm dorn',
      },
    });

    // Verify transporter
    await transporter.verify();
    console.log('Email transporter verified successfully');

    console.log(`Generating URLs for member ${member.fullName}:`);
    console.log(`  Schedule ID: ${scheduleId}`);
    console.log(`  Member ID: ${member._id}`);
    console.log(`  Member ID type: ${typeof member._id}`);
    
    const port = process.env.PORT || 5000;
    const acceptUrl = `http://localhost:${port}/dashboard/schedule/accept/${scheduleId}/${member._id}/yes`;
    const declineUrl = `http://localhost:${port}/dashboard/schedule/accept/${scheduleId}/${member._id}/no`;
    
    console.log(`  Accept URL: ${acceptUrl}`);
    console.log(`  Decline URL: ${declineUrl}`);

    const mailOptions = {
      from: 'bhupanimounika123@gmail.com',
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

    console.log(`Sending email with options:`, {
      to: member.email,
      subject: mailOptions.subject,
      busId: bus.busId,
      shift: shift
    });

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${member.fullName} (${member.email}): ${info.response}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${member.email}:`, error.message);
    console.error('Full error:', error);
    return false;
  }
};

const sendAdminNotification = async (member, shift, bus, scheduleId, response) => {
  try {
    console.log(`Sending admin notification for ${member.fullName} - ${response ? 'Accepted' : 'Declined'}`);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bhupanimounika123@gmail.com',
        pass: 'agsa fgui rksm dorn',
      },
    });

    const mailOptions = {
      from: 'bhupanimounika123@gmail.com',
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Admin notification sent successfully: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending admin notification:`, error.message);
    console.error('Full error:', error);
    return false;
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
      
      // Handle if time is already in 12-hour format
      if (time.includes('AM') || time.includes('PM')) {
        return time;
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
    if (!drivers.length) throw new Error('No drivers available.');
    if (!conductors.length) throw new Error('No conductors available.');

    const shifts = [
      { shift: 'Shift 1 (6 AM - 2 PM)', startTime: '06:00', endTime: '14:00' },
      { shift: 'Shift 2 (2 PM - 10 PM)', startTime: '14:00', endTime: '22:00' },
      { shift: 'Shift 3 (10 PM - 6 AM)', startTime: '22:00', endTime: '06:00' },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);  

    // Clear existing schedules for today
    await Schedule.deleteMany({ scheduleDate: today });
    console.log('Cleared schedules for today');

    const schedules = [];
    
    // Helper function to convert time to minutes for comparison
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Helper function to check if entity is available for a time slot
    const isAvailable = (entityId, date, startTime, endTime, existingSchedules) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      return !existingSchedules.some((s) => {
        if (s.scheduleDate.toDateString() !== date.toDateString()) return false;
        
        // Extract time from stored format
        const sStartStr = s.startTime.split(' ')[0];
        const sEndStr = s.endTime.split(' ')[0];
        
        // Convert to 24-hour format for comparison
        let sStart = timeToMinutes(sStartStr);
        let sEnd = timeToMinutes(sEndStr);
        
        // Handle overnight shifts (e.g., 22:00 to 06:00)
        if (sStart > sEnd) {
          sEnd += 24 * 60; // Add 24 hours
        }
        
        // Handle current shift if it's overnight
        let currentStart = startMinutes;
        let currentEnd = endMinutes;
        if (currentStart > currentEnd) {
          currentEnd += 24 * 60; // Add 24 hours
        }
        
        // Check if entity is already assigned and if times overlap
        const entityInSchedule = s.crewId.some(id => id.toString() === entityId.toString()) || 
                                s.busId.toString() === entityId.toString();
        
        return entityInSchedule && (
          (currentStart < sEnd && currentEnd > sStart)
        );
      });
    };

    // Helper function to find available crew member
    const findAvailableCrew = (crewList, usedCrew, shiftIndex, existingSchedules, today, shifts) => {
      // Shuffle crew list for random assignment
      const shuffledCrew = [...crewList].sort(() => Math.random() - 0.5);
      
      for (const crew of shuffledCrew) {
        // Skip if already used in this assignment cycle
        if (usedCrew.has(crew._id.toString())) continue;
        
        // Check if crew is available for this shift
        const shift = shifts[shiftIndex];
        if (isAvailable(crew._id, today, shift.startTime, shift.endTime, existingSchedules)) {
          return crew;
        }
      }
      
      // If no crew found, log available crew count
      const availableCount = crewList.length - usedCrew.size;
      console.log(`⚠️  No available crew found. ${availableCount}/${crewList.length} crew members available for assignment`);
      
      return null;
    };

    // Log initial resource status
    console.log(`\n🚀 Starting schedule assignment for ${today.toLocaleDateString()}`);
    console.log(`📋 Available Resources:`);
    console.log(`   🚌 Buses: ${buses.length} (${buses.map(b => b.busId).join(', ')})`);
    console.log(`   👨‍💼 Drivers: ${drivers.length} (${drivers.map(d => d.fullName).join(', ')})`);
    console.log(`   👨‍💼 Conductors: ${conductors.length} (${conductors.map(c => c.fullName).join(', ')})`);
    console.log(`   ⏰ Shifts: ${shifts.length} (${shifts.map(s => s.shift).join(', ')})`);
    console.log(`   📅 Max possible assignments: ${buses.length * shifts.length}\n`);

    // Track used resources for this assignment cycle
    const usedDrivers = new Set();
    const usedConductors = new Set();
    const usedBuses = new Set();

    // Try to assign all shifts for all buses until we run out of crew
    let totalAssignments = 0;
    const maxPossibleAssignments = buses.length * shifts.length;
    
    // Iterate through each shift first, then through each bus
    // This ensures we maximize bus utilization across all shifts
    for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex++) {
      const shift = shifts[shiftIndex];
      
      for (const bus of buses) {
        // Skip if this bus is already used in this shift
        if (usedBuses.has(bus._id.toString())) continue;
        
        // Find available driver and conductor for this shift
        const driver = findAvailableCrew(drivers, usedDrivers, shiftIndex, schedules, today, shifts);
        const conductor = findAvailableCrew(conductors, usedConductors, shiftIndex, schedules, today, shifts);
        
        // Only create schedule if both driver and conductor are available
        if (driver && conductor) {
          const schedule = new Schedule({
            busId: bus._id,
            crewId: [driver._id, conductor._id],
            accepted: [null, null], // Pending for driver and conductor
            scheduleDate: today,
            shift: shift.shift,
            startTime: shift.startTime, // Store in 24-hour format
            endTime: shift.endTime,     // Store in 24-hour format
          });

          schedules.push(schedule);
          totalAssignments++;
          
          // Mark resources as used for this assignment cycle
          usedDrivers.add(driver._id.toString());
          usedConductors.add(conductor._id.toString());
          usedBuses.add(bus._id.toString());
          
          console.log(`✅ Assigned ${driver.fullName} (Driver) and ${conductor.fullName} (Conductor) to ${bus.busId} for ${shift.shift}`);
        } else {
          if (!driver) {
            console.log(`❌ No available driver for bus ${bus.busId} in ${shift.shift}`);
          }
          if (!conductor) {
            console.log(`❌ No available conductor for bus ${bus.busId} in ${shift.shift}`);
          }
        }
      }
      
      // Reset used buses for next shift (buses can be used in different shifts)
      usedBuses.clear();
    }
    
    console.log(`📊 Assignment Summary: ${totalAssignments}/${maxPossibleAssignments} possible assignments completed`);
    console.log(`🚌 Buses assigned: ${totalAssignments} out of ${buses.length} buses`);
    console.log(`👥 Crew utilization: ${usedDrivers.size} drivers, ${usedConductors.size} conductors used`);



    // Save all schedules to database first
    if (schedules.length > 0) {
      const savedSchedules = await Schedule.insertMany(schedules);
      console.log(`Generated ${schedules.length} schedules for ${today.toLocaleDateString()}`);
      
      // Send emails if requested (after schedules are saved)
      if (sendEmails) {
        console.log(`Sending emails for ${savedSchedules.length} schedules...`);
        
        for (const savedSchedule of savedSchedules) {
          const [driverId, conductorId] = savedSchedule.crewId;
          const driver = drivers.find(d => d._id.equals(driverId));
          const conductor = conductors.find(c => c._id.equals(conductorId));
          const bus = buses.find(b => b._id.equals(savedSchedule.busId));

          if (driver) {
            console.log(`Sending email to driver: ${driver.fullName}`);
            const driverEmailSent = await sendEmail(driver, savedSchedule.shift, bus, savedSchedule._id, savedSchedule.startTime, savedSchedule.endTime);
            if (!driverEmailSent) {
              console.error(`Failed to send email to driver ${driver.fullName}`);
            }
          }
          if (conductor) {
            console.log(`Sending email to conductor: ${conductor.fullName}`);
            const conductorEmailSent = await sendEmail(conductor, savedSchedule.shift, bus, savedSchedule._id, savedSchedule.startTime, savedSchedule.endTime);
            if (!conductorEmailSent) {
              console.error(`Failed to send email to conductor ${conductor.fullName}`);
            }
          }
        }
        
        console.log('Email sending process completed');
      }
    } else {
      console.log('No schedules could be generated - insufficient resources or conflicts');
    }

    return schedules;
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

// Function to handle auto-reassignment for all declined schedules
const handleAutoReassignment = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all schedules with declined crew members
    const declinedSchedules = await Schedule.find({
      scheduleDate: today,
      accepted: { $in: [false] }
    }).populate('crewId');

    let reassignedCount = 0;

    for (const schedule of declinedSchedules) {
      for (let i = 0; i < schedule.accepted.length; i++) {
        if (schedule.accepted[i] === false) {
          const success = await autoReassignCrew(schedule, i);
          if (success) reassignedCount++;
        }
      }
    }

    res.send(`Auto-reassignment completed. ${reassignedCount} crew members reassigned.`);
  } catch (error) {
    console.error('Error in auto-reassignment:', error);
    res.status(500).send('Error during auto-reassignment');
  }
};

const acceptSchedule = async (req, res) => {
  const { scheduleId, crewId, response } = req.params;
  const accept = response === 'yes';

  try {
    console.log(`Processing schedule response: ${scheduleId}, crew: ${crewId}, response: ${response}`);
    console.log(`Schedule ID type: ${typeof scheduleId}, Crew ID type: ${typeof crewId}`);
    console.log(`Schedule ID length: ${scheduleId?.length}, Crew ID length: ${crewId?.length}`);
    
    const schedule = await Schedule.findById(scheduleId)
      .populate('crewId')
      .populate('busId');
    
    if (!schedule) {
      console.log(`Schedule not found: ${scheduleId}`);
      return res.status(404).send('Schedule not found');
    }

    const crewIndex = schedule.crewId.findIndex(id => id._id.toString() === crewId);
    if (crewIndex === -1) {
      console.log(`Crew member not found in schedule: ${crewId}`);
      return res.status(400).send('Crew member not in schedule');
    }

    console.log(`Updating schedule ${scheduleId} for crew ${crewId} to ${accept ? 'accepted' : 'declined'}`);
    
    schedule.accepted[crewIndex] = accept;
    await schedule.save();

    const member = schedule.crewId[crewIndex];
    console.log(`Sending admin notification for ${member.fullName} - ${accept ? 'accepted' : 'declined'}`);
    await sendAdminNotification(member, schedule.shift, schedule.busId, scheduleId, accept);

    // If declined, try to auto-reassign
    if (!accept) {
      console.log(`Crew declined, attempting auto-reassignment for ${member.fullName}`);
      const reassignmentSuccess = await autoReassignCrew(schedule, crewIndex);
      
      if (reassignmentSuccess) {
        res.send(`Schedule declined. Auto-reassignment successful! New crew member has been notified. Admin has been notified.`);
      } else {
        res.send(`Schedule declined. Auto-reassignment failed - no available crew found. Admin has been notified.`);
      }
    } else {
      res.send(`Schedule accepted! Admin has been notified.`);
    }
  } catch (error) {
    console.error('Error processing acceptance:', error);
    res.status(500).send('Server Error: ' + error.message);
  }
};

// Auto-reassignment function
const autoReassignCrew = async (schedule, declinedCrewIndex) => {
  try {
    console.log(`Starting auto-reassignment for schedule ${schedule._id}, crew index ${declinedCrewIndex}`);
    
    const declinedMember = schedule.crewId[declinedCrewIndex];
    const declinedRole = declinedMember.role;
    
    console.log(`Looking for available ${declinedRole} to replace ${declinedMember.fullName}`);
    
    // Find all crew of the same role
    const allCrewOfRole = await Crew.find({ role: declinedRole });
    console.log(`Found ${allCrewOfRole.length} total ${declinedRole}s`);
    
    // Exclude the declined crew member and any crew already in this schedule
    const excludedIds = schedule.crewId.map(id => id._id.toString());
    const availableCrew = allCrewOfRole.filter(crew => 
      !excludedIds.includes(crew._id.toString())
    );
    
    console.log(`Found ${availableCrew.length} available ${declinedRole}s after filtering`);

    if (availableCrew.length === 0) {
      console.log(`No available ${declinedRole} found for auto-reassignment`);
      return false;
    }

    // Helper function to check availability
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const isAvailable = async (crewId, scheduleDate, startTime, endTime) => {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      // Find all schedules for this crew member on this date
      const conflictingSchedules = await Schedule.find({
        scheduleDate: scheduleDate,
        crewId: crewId,
        accepted: { $ne: false } // Exclude declined schedules
      });

      console.log(`Found ${conflictingSchedules.length} existing schedules for crew ${crewId}`);

      // Check if any existing schedules conflict with the new time
      const hasConflict = conflictingSchedules.some((s) => {
        const sStartStr = s.startTime.split(' ')[0];
        const sEndStr = s.endTime.split(' ')[0];
        
        let sStart = timeToMinutes(sStartStr);
        let sEnd = timeToMinutes(sEndStr);
        
        // Handle overnight shifts
        if (sStart > sEnd) {
          sEnd += 24 * 60;
        }
        
        let currentStart = startMinutes;
        let currentEnd = endMinutes;
        if (currentStart > currentEnd) {
          currentEnd += 24 * 60;
        }
        
        const conflicts = (currentStart < sEnd && currentEnd > sStart);
        if (conflicts) {
          console.log(`Time conflict found: ${currentStart}-${currentEnd} overlaps with ${sStart}-${sEnd}`);
        }
        return conflicts;
      });

      return !hasConflict;
    };

    // Try to find an available crew member
    for (const crew of availableCrew) {
      console.log(`Checking availability for ${crew.fullName} (${crew.role})`);
      const available = await isAvailable(crew._id, schedule.scheduleDate, schedule.startTime, schedule.endTime);
      
      if (available) {
        console.log(`${crew.fullName} is available for reassignment`);
        
        // Replace the declined crew member
        schedule.crewId[declinedCrewIndex] = crew._id;
        schedule.accepted[declinedCrewIndex] = null; // Reset to pending
        
        await schedule.save();
        console.log(`Schedule updated with new crew member: ${crew.fullName}`);
        
        // Send email to new crew member
        const bus = await Bus.findById(schedule.busId);
        const emailSent = await sendEmail(crew, schedule.shift, bus, schedule._id, schedule.startTime, schedule.endTime);
        
        if (emailSent) {
          console.log(`✅ Auto-reassigned ${crew.fullName} (${crew.role}) to schedule ${schedule._id}`);
          return true;
        } else {
          console.log(`❌ Failed to send email to ${crew.fullName}, but reassignment was successful`);
          return true; // Still return true as the reassignment worked
        }
      } else {
        console.log(`${crew.fullName} is not available (has conflicts)`);
      }
    }

    console.log(`No available ${declinedRole} found for auto-reassignment after checking all candidates`);
    return false;
  } catch (error) {
    console.error('Error in auto-reassignment:', error);
    return false;
  }
};

// Daily scheduling at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily schedule assignment...');
  assignSchedules(false);
});

// Email reminders 1 hour before shift
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Find schedules for today that have pending acceptances
    const schedules = await Schedule.find({
      scheduleDate: today,
      accepted: { $in: [null] },
    }).populate('busId').populate('crewId');

    for (const schedule of schedules) {
      const [driver, conductor] = schedule.crewId;
      
      // Check if driver hasn't responded
      if (schedule.accepted[0] === null && driver) {
        await sendEmail(driver, schedule.shift, schedule.busId, schedule._id, schedule.startTime, schedule.endTime);
      }
      
      // Check if conductor hasn't responded
      if (schedule.accepted[1] === null && conductor) {
        await sendEmail(conductor, schedule.shift, schedule.busId, schedule._id, schedule.startTime, schedule.endTime);
      }
    }
  } catch (error) {
    console.error('Error sending email reminders:', error);
  }
});

// Auto-reassignment for declined schedules every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all schedules with declined crew members
    const declinedSchedules = await Schedule.find({
      scheduleDate: today,
      accepted: { $in: [false] }
    }).populate('crewId');

    let reassignedCount = 0;

    for (const schedule of declinedSchedules) {
      for (let i = 0; i < schedule.accepted.length; i++) {
        if (schedule.accepted[i] === false) {
          const success = await autoReassignCrew(schedule, i);
          if (success) reassignedCount++;
        }
      }
    }

    if (reassignedCount > 0) {
      console.log(`Auto-reassigned ${reassignedCount} crew members for declined schedules`);
    }
  } catch (error) {
    console.error('Error in automatic reassignment:', error);
  }
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
    const totalCrew = await Crew.countDocuments();
    
    // Get today's date at midnight for filtering schedules
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch active schedules for today where all crew members have accepted (no false in accepted array)
    const activeSchedules = await Schedule.find({
      scheduleDate: today,
      accepted: { $nin: [false] }, // Exclude schedules where any crew declined
    }).populate('busId crewId');

    // Buses currently on duty (unique bus IDs from active schedules)
    const busesOnDuty = new Set(activeSchedules.map(schedule => schedule.busId?._id.toString())).size;

    // Crew currently on duty (unique crew IDs from active schedules)
    const onDutyCrew = new Set(activeSchedules.flatMap(schedule => schedule.crewId.map(c => c._id.toString()))).size;

    // Active routes (assuming each bus represents a route for now)
    const activeRoutes = busesOnDuty;

    res.render('dashboard', {
      totalBuses,
      totalCrew,
      busesOnDuty,
      onDutyCrew,
      activeRoutes
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Error loading dashboard');
  }
};

// Test email function
const testEmail = async (req, res) => {
  try {
    console.log('Testing email functionality...');
    
    const testMember = {
      fullName: 'Test User',
      email: 'bhupanimounika123@gmail.com', // Send to yourself for testing
      _id: 'test123'
    };
    
    const testBus = {
      busId: 'TEST001'
    };
    
    const emailSent = await sendEmail(
      testMember, 
      'Test Shift (6 AM - 2 PM)', 
      testBus, 
      'test-schedule-id', 
      '06:00', 
      '14:00'
    );
    
    if (emailSent) {
      res.send('✅ Test email sent successfully! Check your inbox.');
    } else {
      res.status(500).send('❌ Test email failed to send. Check console logs.');
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).send('Test email error: ' + error.message);
  }
};

// Test links page function
const getTestLinksPage = async (req, res) => {
  try {
    // Get some sample schedules and crew for testing
    const schedules = await Schedule.find().populate('crewId').populate('busId').limit(5);
    const crew = await Crew.find().limit(5);
    
    res.render('test-links', { schedules, crew });
  } catch (error) {
    console.error('Error rendering test links page:', error);
    res.status(500).send('Error loading test page');
  }
};

module.exports = { getSchedules, autoAssignSchedules, editScheduleShift, deleteSchedule, acceptSchedule, getDashboardData, handleAutoReassignment, testEmail, getTestLinksPage };