const Bus = require('../models/Bus');
const mongoose = require('mongoose'); 
 
exports.registerBus = async (req, res) => {
  try {
    const busData = req.body;  
    const bus = new Bus(busData);
    await bus.save();
 
    const updatedBusList = await Bus.find();
    
    res.status(201).send({
      message: 'Bus registered successfully!',
      updatedBusList: updatedBusList
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
exports.deleteBus = async (req, res) => {
  try {
    const busId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(busId)) {
      return res.status(400).json({ success: false, message: "Invalid bus ID format" });
    }
    const deletedBus = await Bus.findByIdAndDelete(busId);
    if (!deletedBus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }
    res.status(200).json({ success: true, message: "Bus deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete bus" });
  }
};
