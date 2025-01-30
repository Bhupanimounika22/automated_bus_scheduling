const Crew = require('../models/Crew');
const Bus = require('../models/Bus');
const mongoose = require('mongoose');  
 
exports.registerCrew = async (req, res) => {
  try {
    const crewData = req.body;  
    const crew = new Crew(crewData);
    await crew.save();
 
    const updatedCrewList = await Crew.find();
    
    res.status(201).send({
      message: 'Crew member registered successfully!',
      updatedCrewList: updatedCrewList
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
 
exports.getCrewList = async (req, res) => {
  try {
    const crewList = await Crew.find();
    const busList = await Bus.find();   
    res.render('crewmanagement', { crewList, busList });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};
exports.deleteCrew = async (req, res) => {
  try {
    const crewId = req.params.id;  // Directly access id
    if (!mongoose.Types.ObjectId.isValid(crewId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const deletedCrew = await Crew.findByIdAndDelete(crewId);
    if (!deletedCrew) {
      return res.status(404).json({ message: 'Crew member not found' });
    }
    res.status(200).json({ message: 'Crew member deleted successfully' });
  } catch (error) {
    console.error('Error deleting crew member:', error);
    res.status(500).json({ message: 'An error occurred while deleting the crew member' });
  }
};

 // Update crew member details
exports.updateCrew = async (req, res) => {
  try {
    const { crewId } = req.params; // Get crew ID from request parameters
    const updatedData = req.body; // Get updated data from the request body

    // Find the crew member by ID and update their details
    const updatedCrew = await Crew.findByIdAndUpdate(crewId, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the updated data follows the schema
    });

    if (!updatedCrew) {
      return res.status(404).send({ message: 'Crew member not found' });
    }

    // Fetch updated list of crew members
    const updatedCrewList = await Crew.find();

    res.status(200).send({
      message: 'Crew member updated successfully!',
      updatedCrewList: updatedCrewList, // Send the updated list
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
