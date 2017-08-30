#include <SoftwareSerial.h>

#define rxPin 10
#define txPin 11
SoftwareSerial softSerial(rxPin, txPin);

// shouts to https://github.com/rickkas7/serial_tutorial

// Constants
const size_t READ_BUF_SIZE = 64;
const size_t NUM_SERVOS = 5;

// Forward declarations
void processBuffer();

// Global variables
char readBuf[READ_BUF_SIZE];
size_t readBufOffset = 0;

void setup() {
  Serial.begin(9600);
  softSerial.begin(9600);
}

void loop() {
  // Read data from serial
  while(softSerial.available()) {
    if (readBufOffset < READ_BUF_SIZE) {
      char c = softSerial.read();
      if (c != '\n') {
        // Add character to buffer
        readBuf[readBufOffset++] = c;
      }
      else {
        // End of line character found, process line
        readBuf[readBufOffset] = 0;
        processBuffer();
        readBufOffset = 0;
      }
    }
    else {
      readBufOffset = 0;
    }
  }

}

void processBuffer() {
  int val = atoi(readBuf);
  if (val <= 0 || val > NUM_SERVOS) {
    Serial.print("Invalid servo: "); Serial.println(val);
  } else {
    activateServo(val);
  }
}

void activateServo(int which) {
  Serial.print("Activating servo: "); Serial.println(which);
}
