/*
 * Lobo - Indian River Lagoon Client
 * Written by Steven Hunt
 * MIT License
 */

var yaml    = require('js-yaml'),
    fs      = require('fs'),
    request = require('superagent'),
    xml2js  = require('xml2js'),
    _       = require('lodash');

var config = yaml.safeLoad(fs.readFileSync('./configuration.yaml', 'utf8'));

// hash table for getting the data name.
var measurementNames = {};

// build the hash table.
_.keys(config.measurements).forEach(function (key) {
    measurementNames[key] = config.measurements[key].name;
});

/**
 * Returns a list of sensors.
 * @param [minLat] {float} The minimum latitude.
 * @param [maxLat] {float} The maximum latitude.
 * @param [minLng] {float} The minimum longitude.
 * @param [maxLng] {float} The maximum longitude.
 * @returns {Array} The collection of sensor names within the given area.
 */
exports.getSensors = function (minLat, maxLat, minLng, maxLng) {

    // if a geographic box is defined, limit by lat/lon bounds.
    if (minLat && maxLat && minLng && maxLng) {
        var result = [];
        for (var sensor in config.sensors) {
            if (config.sensors.hasOwnProperty(sensor)) {
                if (sensor.location.lat >= minLat &&
                    sensor.location.lat <= maxLat &&
                    sensor.location.lng >= minLng &&
                    sensor.location.lng <= maxLng) {
                    result.push(sensor);
                }
            }
        }
        return result;
    }

    // otherwise, just return the full list of keys.
    return _.keys(config.sensors);
};

/**
 * Gets detailed information about a specific sensor.
 * @param key {string} The sensor name.
 * @returns {Object} Information about the sensor.
 */
exports.getSensor = function (key) {
    return config.sensors[key];
};

/**
 * @private
 * Processes the data for the given sensor.
 * @param sensor {string} The sensor key.
 * @param text {string} The raw sensor data.
 * @param callback {function(err,result)} A callback.
 */
function processSensorData(sensor, text, callback) {

    var resultLines = [],
        resultMeasurements = [],
        result = {},
        time = null,
        measurements = exports.getMeasurements();

    // split the result by line
    text.split("\n").forEach(function (line) {

        // example:
        // <p>2016-07-22 09:00:00 EST</p>
        if (line.indexOf('<p>') === 0 && line.indexOf(':') > 0) {
            time = line
                .replace('/p', 'p')
                .replace(/<p>/g, '');
        }
        else {
            // for each line look for the measurement name at the beginning of the line.
            measurements.every(function (key) {
                if (line.indexOf(measurementNames[key] + ": ") === 0) {
                    resultLines.push(line);
                    resultMeasurements.push(key);
                    return false; // stop looping if we found the match.
                }
                return true;
            });
        }
    });

    // Example line:
    // pH: <b>7.947</b> <br/>
    for (var i = 0; i < resultLines.length; i++) {

        // extract the measurement value.
        result[resultMeasurements[i]] = resultLines[i]
            .replace('<b>', '') // remove the beginning <b> tag.
            .split('</b>')[0] // take everything to the left of the ending <b> tag.
            .split(':')[1] // split by the colon and take the right value.
            .trim();

        // if the measurement is a float, parse it.
        if (exports.getMeasurement(resultMeasurements[i]).type === 'float') {
            result[resultMeasurements[i]] = parseFloat(result[resultMeasurements[i]]);
        }
    }

    // report back on the data.
    callback(null, {
        sensor: sensor,
        dateTime: time,
        data: result
    });
}

/**
 * Queries the given sensor for the latest measurements.
 * @param key {string} The sensor key.
 * @param callback {function(err, result)} A callback.
 */
exports.getSensorData = function (sensor, callback) {

    var sensorInfo = exports.getSensor(sensor);

    request
        .get(sensorInfo.url)
        .send()
        .end(function(err, res) {

            if (err) {
                callback(err);
                return;
            }

            try {
                processSensorData(sensor, res.text, callback);
            }
            catch (err) {
                callback(err);
            }
        });
};

/**
 * Gets a list of supported measurements.
 * @returns {Array} A list of measurements.
 */
exports.getMeasurements = function () {
    return _.keys(config.measurements);
};

/**
 * Gets detailed information about a specific measurement.
 * @param key The measurement name.
 * @returns {Object} Information about the measurement.
 */
exports.getMeasurement = function (key) {
    return config.measurements[key];
};