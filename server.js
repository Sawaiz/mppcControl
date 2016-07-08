//Nodejs server contoling GPIO for HV/LV
//Config.js file has all the sttings
var config = require('./config');

var mosiPin = config.mosiPin;
var sclkPin = config.sclkPin;
var powerOnPin = config.powerOnPin
var powerOkPin = config.powerOkPin;

var positionList = config.sawaizTestPiPositionList;

//**END CONFIGURATION**//
console.log("Server started");
var GPIO = require('onoff').Gpio;

//Place all availible clients in array
var clients = [];
for(device in positionList){
  //Create SPI Client where spiSetup(csPin, mosiPin, sclkPin)
  clients.push(spiSetup(positionList[device][2], mosiPin, sclkPin));
}
for (var i in clients) {
  spiSend(numToByte(0), clients[i]);
}

var powerOn = new GPIO(powerOnPin  , 'out');
var powerOk = new GPIO(powerOkPin  , 'in', 'both');
powerOn.writeSync(0);

var Msg = '';
var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({port: 8010});
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    console.log('Received from client: %s', message);
    message = message.split(" ");
    if(message[0] === "clientsAvailable"){
      ws.send("positionList "+JSON.stringify(positionList));
    } else if (message[0] === "hv") {
      for(var i in clients){
        if(message[2] === positionList[i][0]){
          if(Number(message[1]) === 0){
            spiSend(numToByte(0), clients[i]);
          } else{
            spiSend(voltageToByte(Number(message[1])), clients[i]);
          }
        }
      }
    }else if (message[0] == "lv") {
      powerOn.writeSync(Number(message[1]))
    } else if (message[0] == "lvStatus") {
      var status = powerOk.readSync();
      ws.send("lv" + " " + status.toString());
    }
  });
  powerOk.watch(function(err, value) {
    ws.send("lv" + " " + value.toString());
  });
});

function spiSetup(csPin, mosiPin, sclkPin){
  var cs    = new GPIO(csPin  , 'out');
  var mosi  = new GPIO(mosiPin, 'out');
  var sclk  = new GPIO(sclkPin, 'out');
  var device = {cs:cs, mosi:mosi, sclk:sclk};
  return device;
}

function spiSend(data, device){
  // select device
  device.sclk.writeSync(0);
  device.cs.writeSync(0);
  // send bits 7..0
  for (i = 0; i < 8; i++){
    // set line high if bit is 1, low if bit is 0
    if (data[i] === '1'){
      device.mosi.writeSync(1);
    } else{
      device.mosi.writeSync(0);
    }
    // pull clock to indicate that bit value should be read
    device.sclk.writeSync(1);
    device.sclk.writeSync(0);
  }
  // deselect device
  device.cs.writeSync(1);
}

function voltageToByte(voltage){
  voltageNumber = Math.round(((((voltage-57.5)*-1)*256)/5)-1);
  voltageByte = numToByte(voltageNumber);
  return voltageByte;
}

function numToByte(number){
  var byteString = number.toString(2);
  var paddedByteString = ('00000000'+byteString).substring(byteString.length);
  var byte = paddedByteString.split('');
  return byte;
}
