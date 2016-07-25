/*
 * Lobo - Indian River Lagoon Client
 * Written by Steven Hunt
 * MIT License
 */

var yaml    = require('js-yaml'),
    fs      = require('fs');

const CONFIG_FILE = 'configuration.yaml';

var config = null;

/**
 * lLads the sensor and measurement configuration from the YAML file bundled with the package.
 * @returns {Object} The configuration data.
 */
exports.loadConfig = function () {
    if (!config) {
        config = yaml.safeLoad(fs.readFileSync(__dirname + '/' + CONFIG_FILE, 'utf8'));
    }
    return config;
};
