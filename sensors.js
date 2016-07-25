/*
 * Lobo - Indian River Lagoon Client
 * Written by Steven Hunt
 * MIT License
 */

var request = require('superagent'),
    xml2js  = require('xml2js'),
    Promise = require('bluebird'),
    _       = require('lodash');

var measurementsLib = require('./measurements'),
    utils = require('./utils');

var config = utils.loadConfig();

// hash table for getting the data name.
var measurementNames = {};

// build the hash table.
_.keys(config.measurements).forEach(function (key) {
    measurementNames[key] = config.measurements[key].name;
});

/**
 * Returns a list of all sensors.
 * @returns {Array} The collection of sensor names.
 */
exports.getSensors = function () {
    return _.keys(config.sensors);
};

/**
 * @private
 * Gets the sensors within a specified area.
 * @param minLat {float} The minimum latitude.
 * @param maxLat {float} The maximum latitude.
 * @param minLng {float} The minimum longitude.
 * @param maxLng {float} The maximum longitude.
 * @returns {Array} The collection of sensor names within the given area.
 */
exports.getSensorsByArea = function (minLat, maxLat, minLng, maxLng) {
    var result = [];
    for (var key in config.sensors) {
        if (config.sensors.hasOwnProperty(key)) {
            var sensor = config.sensors[key];
            if (sensor.location.lat >= minLat &&
                sensor.location.lat <= maxLat &&
                sensor.location.lng >= minLng &&
                sensor.location.lng <= maxLng) {
                result.push(key);
            }
        }
    }
    return result;
};

/**
 * @privatae
 * Gets detailed information about a specific sensor.
 * @param key {string} The sensor name.
 * @returns {Object} Information about the sensor.
 */
exports.getSensor = function (key) {
    return config.sensors[key] || null;
};

/**
 * @private
 * Given a sensor key, queries the sensor and parses the result to return an object containing the latest measurements.
 * @param sensor {string} The sensor key.
 * @param [noCache] {boolean} Indicates whether or not to allow caching of responses.
 * @returns {Promise} A promise object for when the data has been queried and processed.
 */
exports.getSensorData = function (sensor, noCache) {
    return new Promise(function (resolve, reject) {

        // get the sensor details.
        var sensorInfo = exports.getSensor(sensor);

        // use the url to query the sensor.
        sendSensorRequest(sensorInfo.url, noCache).then(function (text) {
            // then process the sensor data.
            processSensorData(sensor, text, resolve, reject);
        }).catch(reject);
    });
};

// caches requests to avoid re-querying data.
var requestCache = {};

/**
 *
 * @param url {string} The url to use when querying the sensor.
 * @param [noCache] {boolean} Indicates whether or not to allow caching of responses.
 * @returns {Promise} A promise for when the request has been completed.
 */
function sendSensorRequest(url, noCache) {
    return new Promise(function (resolve, reject) {

        // check the cache first if no-cache is off.
        if (!noCache && requestCache[url]) {
            resolve(requestCache[url]);
        }
        else {
            // perform the request.
            request.get(url)
                .send()
                .end(function (err, res) {
                    if (err || !res || !res.text) { reject(err); }
                    else {
                        resolve(res.text);

                        // cache the result if allowed.
                        if (!noCache) {
                            requestCache[url] = res.text;
                        }
                    }
                });
        }
    });
}

/**
 * @private
 * Processes the data for the given sensor.
 * @param sensor {string} The sensor key.
 * @param text {string} The raw sensor data.
 * @param resolve {function(result)} A resolve callback.
 * @param reject {function(err)} A reject callback.
 */
function processSensorData(sensor, text, resolve, reject) {

    var resultLines = [],
        resultMeasurements = [],
        result = {},
        time = null,
        measurements = measurementsLib.getMeasurements();

    // a collection of parsing strategies to use on the file.
    var parsers = [
        {
            // example:
            // <p>2016-07-22 09:00:00 EST</p>
            condition: function (line) { return line.indexOf('<p>') === 0 && line.indexOf(':') > 0; },
            run: function (line) {
                time = line
                    .replace('/p', 'p')
                    .replace(/<p>/g, '');
            }
        },
        {
            // everything else.
            condition: function () { return true; },
            run: function (line) {
                // for each line look for the measurement name at the beginning of the line.
                // note: every() will exit if the function returns false, whereas forEach will not exit the loop.
                measurements.every(function (key) {
                    if (line.indexOf(measurementNames[key] + ": ") === 0) {
                        resultLines.push(line);
                        resultMeasurements.push(key);
                        return false; // stop looping if we found the match.
                    }
                    return true;
                });
            }
        }
    ];

    // split the result by line
    text.split("\n").forEach(function (line) {
        parsers.every(function (parser) {
            if (parser.condition(line)) {
                parser.run(line);
                return false;
            }
            return true;
        });
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
        if (measurementsLib.getMeasurement(resultMeasurements[i]).type === 'float') {
            result[resultMeasurements[i]] = parseFloat(result[resultMeasurements[i]]);
        }
    }

    // report back on the data.
    resolve({
        sensor: sensor,
        dateTime: time,
        data: result
    });
}