# Land/Ocean Biogeochemical Observatory - Indian River Lagoon
Queries live data from the Lobo sensors operating in the Indian River Lagoon.

For more information about the sensors, visit http://fau.loboviz.com.
## Installation

node:

```
$ npm install lobo-irl
```

## Usage

Retrieving a list of available sensors.

```js
var api = require('lobo-irl');
console.log(api.getSensors());
```

Retrieving a list of available measurements.

```js
var api = require('lobo-irl');
console.log(api.getMeasurements());
```

Retrieving information about a specific sensor.

```js
var api = require('lobo-irl');
console.log(api.getSensor('IRL-JB'));
```

Retrieving information about a specific measurement.

```js
var api = require('lobo-irl');
console.log(api.getMeasurement('temperature'));
```

Query live data from a specific sensor.

```js
var api = require('lobo-irl');
api.getSensorData('IRL-JB', function (err, result) {
    console.log(result);
});
```

## Sensors
The following sensors are available to query.

- **IRL-FP** - Indian River Lagoon - Fort Pierce
- **IRL-LP** - Indian River Lagoon - Link Port
- **IRL-SB** - Indian River Lagoon - Sebastian
- **IRL-VB** - Indian River Lagoon - Vero Beach
- **IRL-JB** - Indian River Lagoon-Jensen Beach
- **IRL-SLE** - Indian River Lagoon-St. Lucie Estuary
- **SLE-ME** - St. Lucie Estuary-Middle Estuary
- **SLE-NF** - St. Lucie Estuary-North Fork
- **SLE-SF** - St. Lucie Estuary-South Fork

## Measurements
The following measurement data is available.

- temperature
- salinity
- dissolved oxygen
- oxygen saturation
- turbidity
- cdom
- chlorophyll
- nitrate
- pH
- phosphate
- depth
- current direction
- current speed
- humidity
- par
- barometric pressure
- rain
- air temperature
- wind direction
- wind speed
- wind gust 