const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  role: { type: String, enum: ['Driver', 'Conductor', 'Dispatcher'], required: true },
  uniqueId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNum: { type: String, required: true }
});
 
module.exports = mongoose.model('Crew', crewSchema);
