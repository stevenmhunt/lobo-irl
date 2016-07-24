
var expect = require("chai").expect,
    fs     = require('fs'),
    yaml   = require('js-yaml'),
    _      = require('lodash'),
    api    = require('../index');

var config = yaml.safeLoad(fs.readFileSync(__dirname + '/configuration.yaml', 'utf8'));

describe('lobo-irl library', function () {

    describe('getSensors', function () {

        it('should return a list of all sensors.', function () {

            var expected = _.keys(config.sensors),
                actual = api.getSensors();

            expect(actual).to.include.apply(expect(actual).to.include, expected);
        });

        it('should return sensors within a given area if there are any.', function () {

            //lat: 27.839089
            //lng: -80.470822
            var box =  {
                lat: {
                    min: 27.839088,
                    max: 27.839090
                },
                lng: {
                    min: -80.470823,
                    max: -80.470821
                }
            };

            var expected = "IRL-SB",
                actual = api.getSensors(box.lat.min, box.lat.max, box.lng.min, box.lng.max);

            expect(actual).to.include(expected);
        });


        it('should not return sensors within a given area box if there are none.', function () {

            //lat: 27.839089
            //lng: -80.470822
            var box =  {
                lat: {
                    min: 24.839088,
                    max: 24.839090
                },
                lng: {
                    min: -84.470823,
                    max: -84.470821
                }
            };

            var expected = "IRL-SB",
                actual = api.getSensors(box.lat.min, box.lat.max, box.lng.min, box.lng.max);

            expect(actual).to.be.empty;
        });
    });

    describe('getSensor', function () {

        it('should return details about a sensor if it exists.', function () {

            var result = api.getSensor('IRL-SB');

            expect(result).not.to.be.null;
            expect(result).to.have.keys('description', 'location', 'url');
            expect(result.description).to.be.equal('Indian River Lagoon - Sebastian');
        });

        it('should return null if the sensor does not exist.', function () {

            var result = api.getSensor('NOT A SENSOR');

            expect(result).to.be.null;
        })

    })
    
    describe('getMeasurements', function () {

        it('should return a list of all measurements.', function () {

            var expected = _.keys(config.measurements),
                actual = api.getMeasurements();

            expect(actual).to.include.apply(expect(actual).to.include, expected);
        });
    });

    describe('getMeasurement', function () {

        it('should return details about a measurement if it exists.', function () {

            var result = api.getMeasurement('pH');

            expect(result).not.to.be.null;
            expect(result).to.have.keys('name', 'type', 'unit', 'medium');
            expect(result.name).to.be.equal('pH');
        });

        it('should return null if the measurement does not exist.', function () {

            var result = api.getMeasurement('NOT A SENSOR');

            expect(result).to.be.null;
        })

    })

    describe('getSensorData', function () {

        it('should query a single sensor and return measurements from it if it exists.', function (done) {

            this.timeout(30000);

            api.getSensorData('IRL-SB').then(function (result) {
                expect(result).not.to.be.array;
                expect(result).to.have.keys('sensor', 'dateTime', 'data');
                expect(result.data).is.array;
                expect(result.data).is.not.empty;
                done();
            }).done(null, done);
        });

        it('should query a all sensors and return measurements from it if no sensor is provided.', function (done) {

            this.timeout(30000);

            api.getSensorData().then(function (result) {
                expect(result).to.be.array;
                expect(result).is.not.empty;
                expect(result.length).is.equal(api.getSensors().length);
                expect(result[0]).to.have.keys('sensor', 'dateTime', 'data');
                expect(result[0].data).is.array;
                expect(result[0].data).is.not.empty;
                done();
            }).done(null, done);
        });

        it('should throw an error if the sensor does not exist.', function (done) {
            api.getSensorData('NOT A SENSOR').then(function (result) {
                expect(result).to.be.null;
                done();
            }, function (err) {
                expect(err).not.to.be.null;
                done();
            });
        });
    });
});