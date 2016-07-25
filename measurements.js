/*
 * Lobo - Indian River Lagoon Client
 * Written by Steven Hunt
 * MIT License
 */

var _ = require('lodash');

var utils = require('./utils');

var config = utils.loadConfig();

/**
 * @private
 * Gets a list of supported measurements.
 * @returns {Array} A list of measurements.
 */
exports.getMeasurements = function () {
    return _.keys(config.measurements);
};

/**
 * @private
 * Gets detailed information about a specific measurement.
 * @param key The measurement name.
 * @returns {Object} Information about the measurement.
 */
exports.getMeasurement = function (key) {
    return config.measurements[key] || null;
};