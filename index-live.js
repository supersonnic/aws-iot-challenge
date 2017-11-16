/*
 * Copyright 2010-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

//npm deps
//Uncomment below dependencies when using live data from sensor
var fs = require('fs');
var parse = require('./node_modules/csv-parse/lib/sync');
var SerialPort = require('serialport');
var delay = require('delay');
var port = new SerialPort('COM8', {
  baudRate: 115200
});

//app deps
const deviceModule = require('./node_modules/aws-iot-device-sdk').device;
const cmdLineProcess = require('./node_modules/aws-iot-device-sdk/examples/lib/cmdline');

// Options used for parsing the csv lines
const parser_options = {
  auto_parse : true,
  columns    : ['Noise','Temperature','X','Y','Z'],
  delimiter  : ','
};

// Begin module ----------------------------------------------------------------
function processTest(args) {
   //
   // The device module exports an MQTT instance, which will attempt
   // to connect to the AWS IoT endpoint configured in the arguments.
   // Once connected, it will emit events which our application can
   // handle.
   //
   const device = deviceModule({
     keyPath: args.privateKey,
     certPath: args.clientCert,
     caPath: args.caCert,
     clientId: args.clientId,
     region: args.region,
     baseReconnectTimeMs: args.baseReconnectTimeMs,
     keepalive: args.keepAlive,
     protocol: args.Protocol,
     port: args.Port,
     host: args.Host,
     debug: args.Debug
   });

/*******************************************************************************
 * This code block is for when the Omega2 is receiving live data from the
 * sensors attached to it. The data is sent from the Adafruit Circuit Playground
 * every 1 sencon, so the interval is not set here. Instead the data is processed
 * and publish to the specified topic as it arrives!
 ******************************************************************************/
 delay(1000) // Delay for 1 second to ensure connection is established
 .then(() => {
 });
 port.setEncoding('utf8');
 // Read the port data when data is available, then preprocess and publish
 port.on('data', function (data) {
   fs.appendFileSync("collected_data.csv", data);
   parsed_data = parse(data, parser_options);   // Parse the line
   parsed_data = parsed_data[0];                // Select the correct element
   parsed_data.deviceID = '0D3D';               // Add the device ID
   var datetime = new Date();                   // Get the current date & time
   parsed_data.dateTime = datetime;             // Add the current date & time
   // Publish the composed json object to the specified topic
   device.publish('omega2/3D0D', JSON.stringify(parsed_data));
 });

 device
 .on('connect', function() {
   console.log('connect');
 });
 device
 .on('close', function() {
   console.log('close');
 });
 device
 .on('reconnect', function() {
   console.log('reconnect');
 });
 device
 .on('offline', function() {
   console.log('offline');
 });
 device
 .on('error', function(error) {
   console.log('error', error);
 });
 device
 .on('message', function(topic, payload) {
   console.log('message', topic, payload.toString());
 });
}

module.exports = cmdLineProcess;

if (require.main === module) {
  cmdLineProcess('connect to the AWS IoT service and publish/subscribe to topics using MQTT, test modes 1-2',
  process.argv.slice(2), processTest);
}
