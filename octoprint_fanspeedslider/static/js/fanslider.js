/*
 * Author: ntoff
 * License: AGPLv3
 */
$(function() {

	function FanSliderPluginViewModel(parameters) {
		var self = this;

		self.printerstate =  parameters[0];
		self.loginstate = parameters[1];
		self.control = parameters[2];
		self.settings = parameters[3];

		//default to 100% fan speed
		fanSpeed = ko.observable(undefined);		
		//convert percentage into PWM
		fanPWM = ko.pureComputed(function () {
			return Math.round(fanSpeed() * 255 / 100);
		});
		//send gcode to set fan speed
		sendFanSpeed = function () {
			self.control.sendCustomCommand({ command: "M106 S" + fanPWM() });
		};	
		//extra classes		
		$("#control > div.jog-panel").eq(0).addClass("controls");
		$("#control > div.jog-panel").eq(1).addClass("tools");
		$("#control > div.jog-panel").eq(2).addClass("general");	
		//If !TouchUI then remove standard buttons + add slider + new buttons
		if ($("#touch body").length ==0 ) { 
			//add ID to buttons 
			$("#control > div.general").find("button").eq(0).attr("id", "motors-off");
			$("#control > div.general").find("button").eq(1).attr("id", "fan-on");
			$("#control > div.general").find("button").eq(2).attr("id", "fan-off");
			//remove original fan on/off buttons
			$("#fan-on").remove();
			$("#fan-off").remove();
			//add new fan controls
			$("#control > div.jog-panel.general").find("button").eq(0).before("\
				<input type=\"number\" style=\"width: 90px\" data-bind=\"slider: {min: 00, max: 100, step: 1, value: fanSpeed, tooltip: 'hide'}\">\
				<button class=\"btn btn-block control-box\" data-bind=\"enable: isOperational() && !isPrinting() && loginState.isUser(), click: function() { sendFanSpeed() }\">" + gettext("Fan on") + ":<span data-bind=\"text: fanSpeed() + '%'\"></span></button>\
				<button class=\"btn btn-block control-box\" data-bind=\"enable: isOperational() && !isPrinting() && loginState.isUser(), click: function() { $root.sendCustomCommand({ type: 'command', commands: ['M106 S0'] }) }\">" + gettext("Fan off") + "</button>\
			");
		} else { //if TouchUI is active we only add the speed input + fan on button in a new section.
			console.log("Fan Speed Slider: NOTICE! TouchUI is active, adding simplified control.");
			$("#control > div.jog-panel.general").after("\
			<div id=\"control-fan-slider\" class=\"jog-panel filament\" data-bind=\"visible: loginState.isUser\">\
				<div>\
					<input type=\"number\" style=\"width: 150px\" data-bind=\"slider: {min: 00, max: 255, step: 1, value: fanSpeed, tooltip: 'hide'}\">\
					<button class=\"btn btn-block control-box\" data-bind=\"enable: isOperational() && !isPrinting() && loginState.isUser(), click: function() { sendFanSpeed() }\">" + gettext("Fan Speed(%)") + "</button>\
				</div>\
			</div>\
		");
		}
		//retrieve settings
		self.onBeforeBinding = function() {
			fanSpeed(self.settings.settings.plugins.fanspeedslider.fanSpeed());
		}
	}	
		OCTOPRINT_VIEWMODELS.push([
			FanSliderPluginViewModel,

		["printerStateViewModel", "loginStateViewModel", "controlViewModel", "settingsViewModel"]
	]);
});