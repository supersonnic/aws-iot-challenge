# AWS IoT Challenge: KinetiConnect
This repository contais the project files for KinetiConnect: Multidimensional Motion Quantification. In this poject I use a number of AWS technologies to visualize 3D acceleration data. The data is collected from acceleration sensor of [Adafruit Circuit Playground](https://www.adafruit.com/product/3000) and is send to the [Onion Omega2+](https://onion.io/store/omega2p/) embedded Linux system through UART protocol. The AWS technologies used include [AWS IoT](https://aws.amazon.com/iot/), [AWS Kinesis](https://aws.amazon.com/kinesis/) and [AWS QuickSight](https://quicksight.aws/).

## Folder Structure
* aws-iot-challenge
  * index-live.js: This node.js program was used to collect live sensor data and publish it to AWS IoT
  * index-sample.js: This program receives the data from a sample CSV file for testing purposes
  * package.json: This is used for installing the NPM dependencies
  * sample_data.csv: Contains the actual sensor data collected from a 2 minute ride!
  * Adafruit Circuit Playground
    * playground.ino: Contains the Arduino code used for programming the Circuit Playground board
  * Images: Contains images used in this markdown file

## Test Instruction
To facilitate testing, I have modified the main node.js program to read the sensor data from a sample file. The sample file was created using a Python program running on the Omega2+, collecting actual sensor data from the Circuit Playground over a 2-minute ride. The test program reads the file line-by-line in 1 second intervals, as if the data was being sent from the Circuit Playground sensors. The test program then appends a time stamp and device ID to the line and publishes the packaged JSON object to AWS IoT. This program would run on the Omega2+ (embedded Linux device) during a ride, therefore the timestamp would be reflective of the time the data was collected.

### For judges:
Since you will be given access to my AWS account as well as the certificate files in the zipped archive, you can used run this program on any device and observe that the data is being sent to my S3 bucket and visualize it. Following describes the steps:
1. Clone this repository:
2. Install NPM dependencies:
3. Run the index-sample.js prgram:

### For the public:
To test this for yourself, you will need to create an AWS account and follow the below architecture to set up the appropriate services. This following overview will help you visualize the AWS architecture and create services used. Additionally, all the services and the setting for each service is listed.
![Image](https://github.com/supersonnic/aws-iot-challenge/blob/master/Images/chart.png)
#### List of services
1. Create a S3 bucket named "omega2-data" with all the default settings

2. AWS Kinesis Firehose delivery streams
  * IoT_Source
  * IoT_Dest_Data
  * IoT_Dest_Aggregate_XYZ
  * IoT_Dest_Aggregate_Temperature
  * Settings: Change source to Direct PUT and S3 buffer interval to 60 seconds for all the firehoses. Additionally, select "omega2-data" as the S3 bucket in use. Use prefixes for each data stream to keep things organized.
  
3. AWS IoT
  * Rule query statement
    * `SELECT Noise, Temperature, X, Y, Z, deviceID, dateTime FROM 'omega2/3D0D'`
  * Actions
    * Send messages to an Amazon Kinesis Firehose
      * Stream name: IoT_Source
      * Separator: \n (newline)

4. AWS Kinesis Analytics applications
  * IoT_Data_Analytics
    * Source: Firehose delivery stream "IoT_Source"
    * Real time analytics SQL code and destinations:
    
```
CREATE OR REPLACE STREAM "DESTINATION_SQL_Data_STREAM" (Noise INTEGER, Temperature DECIMAL(4,2), X DECIMAL(4,2), Y DECIMAL(4,2), Z DECIMAL(4,2), deviceID VARCHAR(4), dateTime TIMESTAMP);

CREATE OR REPLACE PUMP "STREAM_PUMP_1" AS INSERT INTO "DESTINATION_SQL_Data_STREAM"
SELECT STREAM "Noise", "Temperature", "X", "Y", "Z", "deviceID", "dateTime" FROM "SOURCE_SQL_STREAM_001";

CREATE OR REPLACE STREAM "DESTINATION_SQL_AGGREGATE_STREAM" (dateTime TIMESTAMP, maxX DECIMAL(4,2), minX DECIMAL(4,2), maxY DECIMAL(4,2), minY DECIMAL(4,2), maxZ DECIMAL(4,2), minZ DECIMAL(4,2));

CREATE OR REPLACE PUMP "STREAM_PUMP_2" AS INSERT INTO "DESTINATION_SQL_AGGREGATE_STREAM"
SELECT STREAM FLOOR("SOURCE_SQL_STREAM_001".ROWTIME TO MINUTE) AS "dateTime", MAX("X") AS "maxX", MIN("X") AS "minX", MAX("Y") AS "maxY", MIN("Y") AS "minY", MAX("Z") AS "maxZ", MIN("Z") AS "minZ" FROM "SOURCE_SQL_STREAM_001" GROUP BY FLOOR("SOURCE_SQL_STREAM_001".ROWTIME TO MINUTE);

CREATE OR REPLACE STREAM "DESTINATION_SQL_AGGREGATE_TEMP" (dateTime TIMESTAMP, maxTemperature DECIMAL(4,2), minTemperature DECIMAL(4,2));

CREATE OR REPLACE PUMP "STREAM_PUMP_3" AS INSERT INTO "DESTINATION_SQL_AGGREGATE_TEMP"
SELECT STREAM FLOOR("SOURCE_SQL_STREAM_001".ROWTIME TO MINUTE) AS "dateTime", MAX("Temperature") AS "maxTemperature", MIN("Temperature") AS "minTemperature" FROM "SOURCE_SQL_STREAM_001" GROUP BY FLOOR("SOURCE_SQL_STREAM_001".ROWTIME TO MINUTE);
```

| Destination                                             | In-application stream name       |
|---------------------------------------------------------|----------------------------------|
| Firehose delivery stream IoT_Dest_Aggregate_Temperature | DESTINATION_SQL_AGGREGATE_TEMP   |
| Firehose delivery stream IoT_Dest_Aggregate_XYZ         | DESTINATION_SQL_AGGREGATE_STREAM |
| Firehose delivery stream IoT_Dest_Data                  | DESTINATION_SQL_Data_STREAM      |

5. AWS QuickSight Visualizations
 * Create a new visualization using S3 bucket data. Use manifest.json file with this code:
 ```
 {
    "fileLocations": [
              {
                "URIPrefixes": [
                  "https://s3.amazonaws.com/omega2-data/data/"
                  ]
                }
     ],
     "globalUploadSettings": {
     "format": "CSV",
     "delimiter": ",",
     "containsHeader": "false"
    }
}
 ```
 ## Hardware Overview
There are two pieces of hardware used in this project, one is the Onion Omega2+, which is an embedded Linux computer and the other is the Adafruit Circuit Playground, which is a micro-controller and is used here for its set of comprehensive on-board sensors and cool-looking lights!

The micro-controller is programmed to measure 3D acceleration, temperature and noise every 1 second! It then sends that data to the Omega2+ using UART protocol. The Omega2+ then sends that data to AWS IoT using MQTT protocol.

![Image](https://github.com/supersonnic/aws-iot-challenge/blob/master/Images/IMG_20171114_175343598.jpg)
*Hardware Overview*

![Image](https://github.com/supersonnic/aws-iot-challenge/blob/master/Images/initiate.gif)                                              
*User initiates live sampling*

![Image](https://github.com/supersonnic/aws-iot-challenge/blob/master/Images/giphy.gif)                                                 

*User stops the trip, sending the 'end' signal and terminating the node.js program*
