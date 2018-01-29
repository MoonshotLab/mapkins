## Mapkins Machine

For a more detailed writeup, see [here](https://prestonrichey.com/projects/professional/mapkins-machine/).

Text a phone number and get a napkin. Yay!

I should make a fritzing diagram for this, but basically it works like this:
* Text the [Twilio](https://www.twilio.com/) number, which posts a webhook to https://fake.url/sms/receive.
* That message is parsed by [botkit-sms](https://github.com/krismuniz/botkit-sms/), which makes sure the texter said the correct phrase.
* The node server calls the dispense function of a [Particle Electron](https://store.particle.io/collections/electron) with the pertinent stepper index (1-indexed).
* The Electron sends that string via serial to an Arduino Uno with a [CNC Shield](https://www.amazon.com/Witbot-Expansion-Stepper-Arduino-Engraver/dp/B01M9EAYFT) hooked up to 4 [A4988 Stepper Motor Drivers](https://www.pololu.com/product/1182) each connected to a [stepper](https://www.amazon.com/Quimat-Stepper-Connector-Mounting-Brackets/dp/B06XR8Q5Y2).
* The stepper turns a helix which dispenses a Mapkin.

#### Endpoints
* `/` -> `/info` gives basic info about installation.
* `/status` gives the status (number Mapkins left, Electron connected, etc.)
* `/dispense` dispenses to the current stepper
* `/dispense/num` dispenses to a specified stepper
* `/reset` resets the mapkin count to full

#### Setup
`mv dotenv .env` and fill in yr info. Deploy via Dokku. Hope and pray.
