#include "Particle.h"

// shouts to https://github.com/rickkas7/serial_tutorial

// Constants
const unsigned long SEND_INTERVAL_MS = 2000;
const size_t NUM_SERVOS = 5;

// Global variables
int currentServo = 1;
unsigned long lastSend = 0;


void setup() {
  Serial.begin(9600);

  // Serial1 RX is connected to Arduino TX (1)
  // Serial2 TX is connected to Arduino RX (0)
  // Photon GND is connected to Arduino GND
  Serial1.begin(9600);

  Particle.function("dispense", dispense);
}

void loop() {
  return;

  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    if (currentServo > NUM_SERVOS) {
      currentServo = 1;
    }
    lastSend = millis();

    Serial1.println(currentServo++);
  }
}

int dispense(String servoNum) {
  Serial1.println(servoNum);
  Particle.publish("dispense", servoNum);
  return 1;
}
