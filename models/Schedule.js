const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  crewId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crew' }],  
  accepted: [{ type: Boolean, default: null }],  
  scheduleDate: { type: Date, required: true },
  shift: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

module.exports = mongoose.model('Schedule', scheduleSchema);