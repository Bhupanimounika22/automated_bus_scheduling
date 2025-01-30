const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    routeNumber: { type: String, required: true },
    startPoint: { type: String, required: true },
    endPoint: { type: String, required: true },
    activeBuses: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Route', routeSchema);
