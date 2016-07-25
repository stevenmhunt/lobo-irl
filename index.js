/*
 * Lobo - Indian River Lagoon Client
 * Written by Steven Hunt
 * MIT License
 */

var Promise = require('bluebird');

var sensorsLib = require('./sensors'),
    measurementsLib = require('./measurements');

/**
 * Returns a list of sensors.
 * @param [minLat] {float} The minimum latitude.
 * @param [maxLat] {float} The maximum latitude.
 * @param [minLng] {float} The minimum longitude.
 * @param [maxLng] {float} The maximum longitude.
 * @returns {Array} The collection of sensor names.
 */
exports.getSensors = function (minLat, maxLat, minLng, maxLng) {

    // if an area is defined, limit by lat/lng bounds.
    if (minLat && maxLat && minLng && maxLng) {
        return sensorsLib.getSensorsByArea(minLat, maxLat, minLng, maxLng);
    }

    // otherwise, just return the full list of keys.
    return sensorsLib.getSensors();
};

/**
 * Gets detailed information about a specific sensor.
 * @param key {string} The sensor name.
 * @returns {Object} Information about the sensor.
 */
exports.getSensor = function (key) {
    return sensorsLib.getSensor(key);
};

/**
 * Queries the given sensor for the latest measurements.
 * @param [key] {string} The sensor key.
 * @param [callback] {function(err, result)} A callback.
 * @param [noCache] {boolean} Indicates whether or not to allow caching of responses.
 * @returns {Promise} A promise object for when the data is queried.
 */
exports.getSensorData = function (sensor, callback, noCache) {

    // the first parameter is optional, so shift if not provided.
    // this is JavaScript faux method overloading.
    if (sensor && noCache === undefined && typeof sensor === 'function') {
        noCache = callback;
        callback = sensor;
        sensor = null;
    }

    var promise = null;

    // if a specific sensor is requested, just return the data for that sensor.
    if (sensor) {
        promise = sensorsLib.getSensorData(sensor, noCache);
    }
    else {
        // otherwise query the data for all sensors.
        promise = Promise.all(exports.getSensors().map(function (sensor) {
            return sensorsLib.getSensorData(sensor, noCache);
        }));
    }

    // if there is a callback provided, call it.
    if (callback && typeof callback === 'function') {
        promise.then(
            function (result) { callback(null, result); },
            function (err) { callback(err, null); }
        );
    }

    // always return the promise object.
    return promise;
};

/**
 * Gets a list of supported measurements.
 * @returns {Array} A list of measurements.
 */
exports.getMeasurements = function () {
    return measurementsLib.getMeasurements();
};

/**
 * Gets detailed information about a specific measurement.
 * @param key The measurement name.
 * @returns {Object} Information about the measurement.
 */
exports.getMeasurement = function (key) {
    return measurementsLib.getMeasurement(key);
};