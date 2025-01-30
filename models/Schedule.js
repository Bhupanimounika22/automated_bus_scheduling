const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  crewId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crew',
  }],
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
  },
  scheduleDate: Date,
  shift: String,
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
