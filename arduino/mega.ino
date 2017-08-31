#include <SoftwareSerial.h>
#include <Stepper.h>

// Run this on a mega.

// Constants
const size_t READ_BUF_SIZE = 64;
const size_t NUM_SERVOS = 5;
const size_t halfSteps = 8;
const size_t stepsPerRevolution = 256;
const size_t fullRotationSteps = stepsPerRevolution * halfSteps;

const size_t numSteppers = 5;
const size_t stepperSpeed = 42;

// shouts to https://github.com/rickkas7/serial_tutorial
SoftwareSerial softSerial(51, 53);

Stepper stepper1(stepsPerRevolution, 4, 5, 6, 7);
Stepper stepper2(stepsPerRevolution, 8, 9, 10, 11);
Stepper stepper3(stepsPerRevolution, 22, 24, 26, 28);
Stepper stepper4(stepsPerRevolution, 34, 36, 38, 40);
Stepper stepper5(stepsPerRevolution, 46, 48, 50, 52);
Stepper steppers[] = {stepper1, stepper2, stepper3, stepper4, stepper5};

// Forward declarations
void processBuffer();

// Global variables
char readBuf[READ_BUF_SIZE];
size_t readBufOffset = 0;

void setup() {
  Serial.begin(9600);
  Serial.println("Begin");
  softSerial.begin(9600);

  for (int i = 0; i < numSteppers; i++) {
    steppers[i].setSpeed(stepperSpeed);
  }
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
    } else {
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
  Stepper thisStepper = steppers[which - 1]; // steppers are 0 based
  thisStepper.step(fullRotationSteps);
}
