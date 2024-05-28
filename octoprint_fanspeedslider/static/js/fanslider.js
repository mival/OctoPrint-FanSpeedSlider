/*
 * Author: ntoff
 * License: AGPLv3
 */
$(function () {

	function FanSliderPluginViewModel(parameters) {
		//'use strict';
		var self = this;

		self.settings = parameters[0];
		self.control = parameters[1];
		self.loginState = parameters[2];

		self.settings.defaultFanSpeed = new ko.observable(100);	//this,
		self.control.fanSpeed = new ko.observable(100);			//this,
		self.settings.minFanSpeed = new ko.observable(0); 		//this,
		self.settings.maxFanSpeed = new ko.observable(100);		//and this are percents 0 - 100%
		self.settings.notifyDelay = new ko.observable(4000); 	//time in milliseconds
		self.settings.lockfan = new ko.observable(false);		//ignore fan inputs from gcode and lock the fan buttons
		self.settings.defaultLastSpeed = new ko.observable(false); //options page option to set the slider to the last sent fan speed value on load/refresh
		self.settings.lastSentSpeed = new ko.observable(null);	//the last speed value that was sent to the printer

		self.control.lockTitle = new ko.observable(gettext("Unlocked")); //will set the hover title info for the fan lock button

		//Not sure why I put these here, I swear I had a plan when I did it, something about dynamic text? I dunno, should move it back to the settings page
		self.settings.commonTitle = ko.observable(gettext("\n\nThis allows limiting the cooling fan without having to re-slice your model.\n\nLimited to prints controlled by OctoPrint."));
		self.settings.defaultTitle = ko.observable(gettext("This is the value the slider will default to when the UI is loaded / refreshed."));
		self.settings.minTitle = ko.observable(gettext("Set this to the lowest value at which your fan will spin.") + self.settings.commonTitle());
		self.settings.maxTitle = ko.observable(gettext("Set this <100% if your cooling fan is too strong on full.") + self.settings.commonTitle());
		self.settings.noticeTitle = ko.observable(gettext("Notifications only apply when setting the speed via the slider + button in the UI. Set to 0 (zero) to disable notifications."));
		self.settings.lastspeedTitle = ko.observable(gettext("Instead of defaulting to the speed set by \"Default Value\", the slider will be set to the last sent speed on load / refresh. \n\n Note: It takes into account the min/max value setting and overrides the \"Default Value\" setting."));

		self.showNotify = function (self, options) {
			options.title = "Fan Speed Control";
			options.delay = options.delay || self.settings.notifyDelay();
			options.type = options.type || "info";
			if (options.delay != "0") {
				new PNotify(options);
			}
		};

		self.control.fanSpeedToPwm = ko.pureComputed(function () {
			self.speed = self.control.fanSpeed() * 255 / 100 //don't forget to limit this to 2 decimal places at some point.
			return self.speed;
		});

		self.control.checkSliderValue = ko.pureComputed(function () {
			if (self.control.fanSpeed() < self.settings.minFanSpeed() && self.control.fanSpeed() != "0") {
				console.log("Fan Speed Control Plugin: " + self.control.fanSpeed() + "% is less than the minimum speed (" + self.settings.minFanSpeed() + "%), increasing.");
				self.control.fanSpeed(self.settings.minFanSpeed());
				var options = {
					hide: true,
					text: gettext('Fan speed increased to meet minimum speed requirement.'),
					addclass:  'fan_speed_notice_low',
				}
				if ($(".fan_speed_notice_low").length <1) {
					self.showNotify(self, options);
				}
			}
			else if (self.control.fanSpeed() > self.settings.maxFanSpeed()) {
				console.log("Fan Speed Control Plugin: " + self.control.fanSpeed() + "% is more than the maximum speed (" + self.settings.maxFanSpeed() + "%), decreasing.");
				self.control.fanSpeed(self.settings.maxFanSpeed());
				var options = {
					hide: true,
					text: gettext('Fan speed decreased to meet maximum speed requirement.'),
					addclass:  'fan_speed_notice_high',
				}
				if ($(".fan_speed_notice_high").length <1) {
					self.showNotify(self, options);
				}
			}
		});

		//send gcode to set fan speed
		self.control.sendFanSpeed = function () {
			self.control.checkSliderValue();
			self.control.sendCustomCommand({ command: "M106 S" + self.control.fanSpeedToPwm() });

			if (self.settings.defaultLastSpeed()) {
				self.settings.settings.plugins.fanspeedslider.lastSentSpeed(self.control.fanSpeed());
				self.settings.saveData();
				self.updateSettings();
			}
		};

		self.control.increaseFanSpeed = function () {
			self.control.checkSliderValue();
			const currentValue = self.control.fanSpeed();
			if (currentValue < 100) {
				self.control.fanSpeed(currentValue + 1);
			}
		};

		self.control.decreaseFanSpeed = function () {
			self.control.checkSliderValue();
			const currentValue = self.control.fanSpeed();
			if (currentValue > 0) {
				self.control.fanSpeed(currentValue - 1);
			}
		};

		self.control.lockFanInput = function () {
			self.settings.settings.plugins.fanspeedslider.lockfan(!self.settings.settings.plugins.fanspeedslider.lockfan());
			self.settings.saveData();
			self.updateSettings();

			var options = {
				type: "info",
				hide: true,
				delay: 1000*60,
				text: gettext('CAUTION!! Fan speed commands are now being ignored! \n This includes commands sent via gcode and the terminal!'),
				addclass:  'fan_speed_notice_fanlocked',
			}
			if (self.settings.lockfan() && $(".fan_speed_notice_fanlocked").length <1) {
				self.showNotify(self, options);
			}
		}
		//disables the on/off buttons if the lock is enabled
		self.control.islocked = ko.pureComputed(function () {
			return self.settings.settings.plugins.fanspeedslider.lockfan();
		});

		//ph34r
		try {
			//for some reason touchui uses "jog general" for the fan controls? Oh well, makes my job easier
			$("#control-jog-general").find("button").eq(0).attr("id", "motors-off");
			$("#control-jog-general").find("button").eq(1).attr("id", "fan-on");
			$("#control-jog-general").find("button").eq(2).attr("id", "fan-off");
			//If not TouchUI then remove standard buttons + add slider + new buttons
			if ($("#touch body").length == 0) {
				//remove original fan on/off buttons
				$("#fan-on").remove();
				$("#fan-off").remove();
				//add new fan controls
				$("#control-jog-general").find("button").eq(0).before("\
					<button class=\"btn\" style=\"padding: 3px;margin: 0 3px 8px 0;\" data-bind=\"click: function() { $root.decreaseFanSpeed() }\">\
						<i class=\"fa fa-minus\"></i>\
					</button>\
					<input type=\"number\" style=\"width: 50px\" data-bind=\"slider: {min: 00, max: 100, step: 1, value: fanSpeed, tooltip: 'hide'}\">\
					<button class=\"btn\" style=\"padding: 3px;margin: 0 0 8px 8px;\" data-bind=\"click: function() { $root.increaseFanSpeed() }\">\
						<i class=\"fa fa-plus\"></i>\
					</button>\
					<button class=\"btn btn-block control-box\" id=\"fan-on\" data-bind=\"enable: isOperational() && loginState.isUser() && !islocked(), click: function() { $root.sendFanSpeed() }\">" + gettext("Fan speed") + ":<span data-bind=\"text: fanSpeed() + '%'\"></span></button>\
					<div class=\"btn-group\">\
						<button class=\"btn \" id=\"fan-off\" data-bind=\"enable: isOperational() && loginState.isUser() && !islocked(), click: function() { $root.sendCustomCommand({ type: 'command', commands: ['M106 S0'] }) }\">" + gettext("Fan off") + "</button>\
						<button class=\"btn \" id=\"fan-lock\" data-bind=\"enable: isOperational() && loginState.isUser(), click: function() { $root.lockFanInput() }, attr: { title: lockTitle } \">\
							<i class=\"fa fa-unlock\" data-bind=\"css: {'fa-lock': islocked(), 'fa-unlock': !islocked()}\"></i>\
						</button>\
					</div>\
				");
			} else {
				//replace touch UI's fan on button with one that sends whatever speed is set in this plugin
				$("#fan-on").remove();
				$("#control-jog-general").find("button").eq(0).after("\
					<button class=\"btn btn-block control-box\" id=\"fan-on\" data-bind=\"enable: isOperational() && loginState.isUser(), click: function() { $root.sendFanSpeed() }\">" + gettext("Fan on") + "</button>\
				");
				//also add spin box + button below in its own section, button is redundant but convenient
				$("#control-jog-feedrate").append("\
					<input type=\"number\" style=\"width: 150px\" data-bind=\"slider: {min: 00, max: 100, step: 1, value: fanSpeed, tooltip: 'hide'}\">\
					<button class=\"btn btn-block\" style=\"width: 169px\" data-bind=\"enable: isOperational() && loginState.isUser() && !islocked(), click: function() { $root.sendFanSpeed() }\">" + gettext("Fan speed:") + "<span data-bind=\"text: fanSpeed() + '%'\"></span></button>\
					<button class=\"btn \" id=\"fan-lock\" data-bind=\"enable: isOperational() && loginState.isUser(), click: function() { $root.lockFanInput() }, attr: { title: lockTitle } \">\
						Fan Control Lock: <i class=\"fa fa-unlock\" data-bind=\"css: {'fa-lock': islocked(), 'fa-unlock': !islocked()}\"></i>\
					</button>\
					");
			}
		}
		catch (error) {
			console.log(error);
		}

		self.updateSettings = function () {
			try {
				self.settings.minFanSpeed(parseInt(self.settings.settings.plugins.fanspeedslider.minSpeed()));
				self.settings.maxFanSpeed(parseInt(self.settings.settings.plugins.fanspeedslider.maxSpeed()));
				self.settings.notifyDelay(parseInt(self.settings.settings.plugins.fanspeedslider.notifyDelay()));
				self.settings.lockfan(self.settings.settings.plugins.fanspeedslider.lockfan());

				if (self.settings.lockfan()) {
					self.control.lockTitle( gettext("Lock or unlock the cooling fan controls. When locked, no cooling fan commands will be sent to the printer. \n\n Fan controls are locked."));
				}
				else if (!self.settings.lockfan()) {
					self.control.lockTitle( gettext("Lock or unlock the cooling fan controls. When locked, no cooling fan commands will be sent to the printer. \n\n Fan controls are unlocked"))
				}
				self.settings.defaultLastSpeed(self.settings.settings.plugins.fanspeedslider.defaultLastSpeed());
			}
			catch (error) {
				console.log(error);
			}
		}

		self.onDataUpdaterPluginMessage = function(plugin, data) {
			if (plugin != "fanspeedslider") {
				return;
			}

			if(data.hasOwnProperty('fanPwm')){
				console.log("received fanpwm: " + data.fanPwm)
				self.control.fanSpeed(parseInt(data.fanPwm / 255 * 100));
				self.settings.defaultFanSpeed(parseInt(data.fanPwm / 255 * 100));
				self.settings.lastSentSpeed(parseInt(data.fanPwm / 255 * 100));
			}
		}

		self.onBeforeBinding = function () {
			self.settings.defaultFanSpeed(parseInt(self.settings.settings.plugins.fanspeedslider.defaultFanSpeed()));
			self.settings.lastSentSpeed(parseInt(self.settings.settings.plugins.fanspeedslider.lastSentSpeed()));
			self.updateSettings();
			//if the default fan speed is above or below max/min then set to either max or min
			if (self.settings.defaultFanSpeed() < self.settings.minFanSpeed()) {
				self.control.fanSpeed(self.settings.minFanSpeed());
			}
			else if (self.settings.defaultFanSpeed() > self.settings.maxFanSpeed()) {
				self.control.fanSpeed(self.settings.maxFanSpeed());
			}
			else if (self.settings.defaultLastSpeed()) {
				self.control.fanSpeed(self.settings.lastSentSpeed());
			}
			else {
				self.control.fanSpeed(self.settings.defaultFanSpeed());
			}
		}

		//update settings in case user changes them, otherwise a refresh of the UI is required
		self.onSettingsHidden = function () {
			self.updateSettings();
		}
	}

	OCTOPRINT_VIEWMODELS.push({
		construct: FanSliderPluginViewModel,
		additionalNames: [],
		dependencies: ["settingsViewModel", "controlViewModel", "loginStateViewModel"],
		optional: [],
		elements: []
	});
});