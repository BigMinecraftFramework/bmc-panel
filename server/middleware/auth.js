const jwt = require('jsonwebtoken');
const config = require('../config');
const { getUser } = require("../controllers/database");
const kubernetesClient = require("../controllers/k8s");

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) return res.status(403).send({ message: 'No token provided.' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).send({ message: 'Invalid token format.' });

    try {
        const decoded = jwt.verify(token, config["token-secret"]);
        let user = decoded.username;

        const dbUser = await getUser(user);
        const last_logout = dbUser.last_logout;

        if (last_logout) {
            const lastLogoutTimestamp = new Date(last_logout).getTime() / 1000;
            const currentTime = Date.now() / 1000;

            if (decoded.iat < lastLogoutTimestamp && kubernetesClient.isRunningInCluster()) {
                return res.status(401).send({ message: 'Token has expired.' });
            }
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({ message: 'Token has expired.' });
        }
        return res.status(401).send({
            message: 'Failed to authenticate token.',
            error: err.message
        });
    }
};

const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) return res.status(403).send({ message: 'No token provided.' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).send({ message: 'Invalid token format.' });

    try {
        const decoded = jwt.verify(token, config["token-secret"]);
        let user = decoded.username;

        const dbUser = await getUser(user);
        const last_logout = dbUser.last_logout;

        if (last_logout) {
            const lastLogoutTimestamp = new Date(last_logout).getTime() / 1000;

            if (decoded.iat < lastLogoutTimestamp && kubernetesClient.isRunningInCluster()) {
                return res.status(401).send({ message: 'Token has expired.' });
            }
        }

        if (!dbUser.is_admin) return res.status(403).send({ message: 'Unauthorized.' });

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({ message: 'Token has expired.' });
        }
        return res.status(401).send({
            message: 'Failed to authenticate token.',
            error: err.message
        });
    }
};

module.exports = {
    verifyToken,
    verifyAdminToken
};
