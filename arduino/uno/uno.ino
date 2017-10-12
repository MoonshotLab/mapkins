// Constants
const bool serialPrint = true;
const size_t READ_BUF_SIZE = 64;

const int NUM_STEPPERS = 4;
const int enablePin = 8;

// steppers are {step, direction}
const int steppers[4][2] = {
  {2, 5},
  {3, 6},
  {4, 7},
  {12, 13}
};

const int numberOfSteps = 200;

const int pulseWidthMicros = 20;  // µs
const int millisbetweenSteps = 10; // ms

// Forward declarations
void processBuffer();

// Global variables
char readBuf[READ_BUF_SIZE];
size_t readBufOffset = 0;

void setup() {
  Serial.begin(9600);

  if (serialPrint) {
    Serial.println("Begin");
  }

  setupPins();
  // testAllSteppers();
}

void loop() {
  // Read data from serial
  while(Serial.available()) {
    if (readBufOffset < READ_BUF_SIZE) {
      char c = Serial.read();
      if (c != '\n') {
        // Add character to buffer
        readBuf[readBufOffset++] = c;
        if (serialPrint) {
          Serial.println(c);
        }
      } else {
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
  if (val <= 0 || val > NUM_STEPPERS) {
    if (serialPrint) {
      Serial.print("Invalid stepper: "); Serial.println(val);
    }
  } else {
    turnStepper(val, true);
  }
}

void setupPins() {
  for (int i = 0; i < NUM_STEPPERS; i++) {
    int stepPin = steppers[i][0];
    int directionPin = steppers[i][1];

    pinMode(stepPin, OUTPUT); // step
    pinMode(directionPin, OUTPUT); // direction
  }

  pinMode(enablePin, OUTPUT);
}

void turnStepper(int stepperNum, bool clockwise) {
  digitalWrite(enablePin, LOW); // enable

  if (serialPrint) {
    Serial.print("Turning stepper "); Serial.print(stepperNum);
    if (clockwise == true) {
      Serial.println(" clockwise");
    } else {
      Serial.println(" counterclockwise");
    }
  }

  int zeroIndexedStepperNum = stepperNum - 1;
  int stepPin = steppers[zeroIndexedStepperNum][0];
  int directionPin = steppers[zeroIndexedStepperNum][1];

  if (clockwise == true) {
    digitalWrite(directionPin, LOW);
  } else {
    digitalWrite(directionPin, HIGH);
  }

  for (int n = 0; n < numberOfSteps; n++) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(pulseWidthMicros);
    digitalWrite(stepPin, LOW);

    delay(millisbetweenSteps);
  }

  delay(100); // wait so we don't cut off turning
  digitalWrite(enablePin, HIGH); // disable
}

void testAllSteppers() {
  for (int i = 1; i <= NUM_STEPPERS; i++) {
    turnStepper(i, true);
    delay(1000);
    turnStepper(i, false);
    delay(2000);
  }
}
