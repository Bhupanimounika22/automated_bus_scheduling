const Route = require('../models/Route');
 
exports.addRoute = async (req, res) => {
    try {
        const { routeNumber, startPoint, endPoint, activeBuses } = req.body;

        const newRoute = new Route({
            routeNumber,
            startPoint,
            endPoint,
            activeBuses,
        });

        const savedRoute = await newRoute.save();   
        res.status(201).json(savedRoute);  
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add route' });
    }
};

 
exports.getRoutes = async (req, res) => {
    try {
        const routes = await Route.find();  
        res.status(200).json(routes);  
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
};
