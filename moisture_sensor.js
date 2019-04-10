var five = require('johnny-five');
var board = new five.Board();

// Sonar Sensor
var sonarSensorAnalogReadPin = 1; // Analog Pin 1

// Relay
var relayDigitalSwitchPin = 8; // Digital Pin 8
var RELAY_OFF = 0;
var RELAY_ON = 1;

// Relay Operations
function startWateringPlants(board) {
  board.digitalWrite(relayDigitalSwitchPin, RELAY_ON);
}

function stopWateringPlants(board) {
  board.digitalWrite(relayDigitalSwitchPin, RELAY_OFF);
}

// Checks
function waterLevelCheck(value, minWaterLevelVal) {
  if (value <= minWaterLevelVal) {
    return true;
  } else {
    return false;
  }
}

function isPlantDry(value, targetMoistureVal) {
  if (value <= targetMoistureVal) {
    return true;
  } else {
    return false;
  }
}

function togglePlantWatering(board, incomingSoilMoistureVal, waterLevelIsAcceptable, targetMoistureVal) {
  var moistureSensorBufferValue = 25; // Must be above this value to avoid accidently getting low-reading voltage values randomly

  if (incomingSoilMoistureVal > moistureSensorBufferValue) {
    if (waterLevelIsAcceptable) {
      if (isPlantDry(incomingSoilMoistureVal, targetMoistureVal)) {
        board.info("Board", "plant is dry!");
        startWateringPlants(board);
      } else {
        board.info("Board", "plant is doing a-ok");
        stopWateringPlants(board);
      }
    } else {
      stopWateringPlants(board);
    }
  }
}

function turnOnDigitalReaders(board, soilDigitalPowerPin) {
  board.digitalWrite(soilDigitalPowerPin, 1); // Turn on to start reading the soilDataPin
}

board.on('ready', function() {
  var waterLevelIsAcceptable = false;

  // Moisture Sensor
  var soilAnalogReadPin = 0; // Analog Pin 0
  var soilDigitalPowerPin = 7; // Digital Pin 7

  // Moisture Sensor Initial
  var targetMoistureVal = 500;

  // Water Sensor Values
  var minWaterLevelVal = 550;

  // This will limit sampling of all Analog Input
  // and I2C sensors to once per second (1000 milliseconds)
  this.samplingInterval(1000);

  board.pinMode(soilDigitalPowerPin, five.Pin.OUTPUT);
  board.pinMode(soilAnalogReadPin, five.Pin.INPUT);

  board.pinMode(relayDigitalSwitchPin, five.Pin.OUTPUT);

  // Ensure this is turned off when starting
  board.digitalWrite(soilDigitalPowerPin, 0);
  board.digitalWrite(relayDigitalSwitchPin, RELAY_OFF);

  turnOnDigitalReaders(board, soilDigitalPowerPin);

  board.analogRead(sonarSensorAnalogReadPin, function(val) {
    waterLevelIsAcceptable = waterLevelCheck(val, minWaterLevelVal);
  });

  board.analogRead(soilAnalogReadPin, function(voltage) {
    togglePlantWatering(board, voltage, waterLevelIsAcceptable, targetMoistureVal);
  });

  board.on("exit", function() {
    board.digitalWrite(relayDigitalSwitchPin, RELAY_OFF);
    board.digitalWrite(soilDigitalPowerPin, 0);
    board.info("Board", "Exiting");
  });
});
