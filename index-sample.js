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
var fs = require('fs');
var parse = require('./node_modules/csv-parse/lib/sync');
var readLines = require('n-readlines');

//app deps
const deviceModule = require('./node_modules/aws-iot-device-sdk').device;
const cmdLineProcess = require('./node_modules/aws-iot-device-sdk/examples/lib/cmdline');

// Options used for reading the csv file
const reader_options = {
  flags     : 'r',
  encoding  : 'utf8',
  fd        : null,
  autoClose : true
};

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

   var timeout;
   const delay = 1000;
   console.log('Interval is ' + delay + 'ms!');

/*******************************************************************************
* This code block uses the previously-generated sample data file to facilitate
* testing. The data is read from a sample data file "sample_data.csv" instead
* of being read from the live sensors. This is for demonstration purposes.
******************************************************************************/
   var liner = new readLines('sample_data.csv');  // Initialize a read stream
   // Read the csv file line-by-line, convert to json and publish to AWS IoT
   timeout = setInterval(function() {
     line = liner.next();                         // Read next line
     if (!line) {process.exit(1);}                // End program at EOF
     parsed_data = parse(line, parser_options);   // Parse the line
     parsed_data = parsed_data[0];                // Select the correct object
     parsed_data.deviceID = '0D3D';               // Append the device ID
     var datetime = new Date();                   // Get the current date & time
     parsed_data.dateTime = datetime;             // Append dateTime field
     // Publish the composed json object to the specified topic & print it out
     device.publish('omega2/3D0D', JSON.stringify(parsed_data));
     console.log("Published: " + JSON.stringify(parsed_data));
   }, delay);

   //
   // Do a simple publish/subscribe demo based on the test-mode passed
   // in the command line arguments.  If test-mode is 1, subscribe to
   // 'topic_1' and publish to 'topic_2'; otherwise vice versa.  Publish
   // a message every four seconds.
   //
   device
      .on('connect', function() {
         console.log('Sample data is being published now...');
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
