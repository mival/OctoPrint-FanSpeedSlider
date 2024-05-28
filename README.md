# Fan Speed Slider Plugin

Add a slider to control the speed of a parts cooling fan.

![Slider](./image/slider.jpg)

## Usage

Slide the slider or use plus and minus button, click the set button. There really isn't much else to do :)

## Settings

* The default value of the slider is user configurable, this is the value that the slider will be set to upon loading OctoPrint's UI, and any time you refresh the page.

* The remember last speed checkbox will tell the plugin to save the fan speed as it gets sent to the printer, and set the slider to that value on load / refresh (overrides the default value setting).

* The minimum fan speed setting will limit how slow the fan runs, this is useful since some fans don't work below a certain speed.

* The maximum fan speed setting will limit how fast the fan runs, this is useful if your fan is too strong, or you wish to limit the speed post-slice without having to re-slice your file.

* "Disable M106 / M107" will disable the controls and reject all M106/M107 commands before they're sent to the printer. This setting has a corresponding padlock button beside the off button, both the padlock button and this setting in the settings page do exactly the same thing. This setting is here only as a convenience.

* Notification autohide delay controls how long any notifications will remain on the screen for. If the user manually sets a speed outside of the set range, a notification will be displayed informing the user the fan speed has been modified. Print jobs shouldn't trigger these notifications, and so popup spam shouldn't occur, however if a user wishes not to receive notifications when setting fan speeds outside of the set range, this value can be set to 0 (zero) to disable notifications. (this setting won't / shouldn't affect OctoPrint's global notifications, it only applies to info popups generated by this plugin).

*Note: Slider does __not__ follow the speed of the fan. If the fan speed is set via gcode or an LCD panel on the printer, the slider will not respond to the change. It is a __setting__, not an indicator, and functions the same way the feedrate and flowrate sliders do.*

## Setup

Install manually using this URL:

    https://github.com/mival/OctoPrint-fanspeedslider/archive/master.zip

## ABOUT

This is a fork from the first OctoPrint Fan Speed Slider by NTOFF that's compatible with Python 3 since the main project is abandoned.

This fork added +/- buttons from https://github.com/czM1K3/OctoPrint-FanSpeedSlider