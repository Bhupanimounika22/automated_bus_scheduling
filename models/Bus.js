const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true },
  busType: { type: String, required: true }
});
 
module.exports = mongoose.model('Bus', busSchema);
