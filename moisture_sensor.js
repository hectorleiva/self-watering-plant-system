var five = require('johnny-five');
var board = new five.Board();

// Moisture Sensor
var soilAnalogReadPin = 0; // Analog Pin 0
var soilDigitalPowerPin = 7; // Digital Pin 7
var moistureSensorBufferValue = 25; // Must be above this value to avoid accidently getting low-reading voltage values randomly

// Water Sensor
var waterDigitalReadPin = 1; // Analog Pin 1

// Relay
var relayDigitalSwitchPin = 8; // Digital Pin 8
var RELAY_OFF = 1;
var RELAY_ON = 0;

/**
 * Global Values
 */

// Moisture Sensor Initial
var targetMoistureVal = 500;

// Water Sensor Values
var minWaterLevelVal = 130;

// Relay Operations
function startWateringPlants(board) {
  board.digitalWrite(relayDigitalSwitchPin, RELAY_ON);
}

function stopWateringPlants(board) {
  board.digitalWrite(relayDigitalSwitchPin, RELAY_OFF);
}

// Checks
function waterLevelCheck(value) {
  if (value >= minWaterLevelVal) {
    return true;
  } else {
    return false;
  }
}

function isPlantDry(value) {
  if (value <= targetMoistureVal) {
    return true;
  } else {
    return false;
  }
}

function togglePlantWatering(board, incomingSoilMoistureVal, waterLevelIsAcceptable) {
  if (incomingSoilMoistureVal > moistureSensorBufferValue) {
    if (waterLevelIsAcceptable) {
      if (isPlantDry(incomingSoilMoistureVal)) {
        startWateringPlants(board);
      } else {
        stopWateringPlants(board);
      }
    } else {
      stopWateringPlants(board);
    }
  }
}

function turnOnDigitalReaders(board) {
  board.digitalWrite(soilDigitalPowerPin, 1); // Turn on to start reading the soilDataPin
}

function turnOffDigitalReaders(board) {
  board.digitalWrite(soilDigitalPowerPin, 0); // Turn off to stop reading the soilDataPin
}

board.on('ready', function() {
  var waterLevelIsAcceptable = true;
  this.pinMode(soilDigitalPowerPin, five.Pin.OUTPUT);
  this.pinMode(soilAnalogReadPin, five.Pin.INPUT);

  this.pinMode(relayDigitalSwitchPin, five.Pin.OUTPUT);

  // Ensure this is turned off when starting
  this.digitalWrite(soilDigitalPowerPin, 0);
  this.digitalWrite(relayDigitalSwitchPin, RELAY_OFF);

  this.analogRead(waterDigitalReadPin, function(val) {
    waterLevelIsAcceptable = waterLevelCheck(val);
  });

  this.analogRead(soilAnalogReadPin, function(voltage) {
    togglePlantWatering(board, voltage, waterLevelIsAcceptable);
  });

  // Every 10 seconds, turn on the digital power
  this.loop(3000, function() {
    turnOnDigitalReaders(board);

    // Wait 100 milliseconds and then turn this off
    board.wait(1000, function() {
      turnOffDigitalReaders(board);
    });
  });

  this.on("exit", function() {
    board.digitalWrite(relayDigitalSwitchPin, RELAY_OFF);
    board.digitalWrite(soilDigitalPowerPin, 0);
  });
});
