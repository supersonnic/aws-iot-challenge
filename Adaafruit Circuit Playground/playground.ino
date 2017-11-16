#include <Adafruit_CircuitPlayground.h>

float X, Y, Z, temperature; // This is where sensor data is stored
int sound, light;           // More variables containing storing data
String message;             // This variable holds the composed message

void setup() {
  
  // Opening a serial port for UART comm with the Omega2+
  Serial1.begin(115200);
  CircuitPlayground.begin();
  
  /*  Following block handles the UI. It blinks notification lights
   *   in set patterns, notifying the user of the current state.
   *   Additionally, it waits for the start signal through a button.
   */
   // Ready State: waiting for user to initiate program
  CircuitPlayground.clearPixels();
  while (!CircuitPlayground.leftButton()){
    for (int i = 0; i < 10; i++){
      CircuitPlayground.setPixelColor(i, 0,   0,   255);
      if (CircuitPlayground.leftButton()) break;
      delay(100);
      CircuitPlayground.clearPixels();
    }
  }
  
  // Initiated State: Notifying the user of initiation
  CircuitPlayground.clearPixels();
  for (int i = 0; i < 10; i++){
    CircuitPlayground.setPixelColor(i, 0,   255,   0);
    delay(100);
  }
    for (int i = 0; i < 10; i++){
    CircuitPlayground.setPixelColor(i, 0,   0,   0);
    delay(100);
  }
}

  /*  Main loop: This block constantly reads the specified sensor
   *   values, sending them to the Omega2+ every 1 second.
   *   Additionally, it listens for user input through a button
   *   and sends an 'end' signal to kill the program running on
   *   the Omega2+, hence stopping the data stream.
   */
void loop() {
  CircuitPlayground.redLED(HIGH);
  
  // This block is triggered if the end button is pressed
  if (CircuitPlayground.rightButton()){
    Serial1.println("end");
    CircuitPlayground.redLED(LOW);
    for (int i = 0; i < 10; i++){
      CircuitPlayground.setPixelColor(i, 255,   0,   0);
      }
    delay(3000);
    CircuitPlayground.clearPixels();
  }

  // This is where the sensor values are read and sent to Omega2+
  X = CircuitPlayground.motionX();
  Y = CircuitPlayground.motionY();
  Z = CircuitPlayground.motionZ();
  sound = CircuitPlayground.soundSensor();
  temperature = CircuitPlayground.temperature();

  message = sound;
  message = message + ',' + temperature + ',' + X + ',' + Y + ',' + Z;

  Serial1.println(message);
  CircuitPlayground.redLED(LOW);
  delay(1000); // 1 second delay
}
