import React, { Component } from "react";
var moment = require("moment");
// var Moment_Timezone = require("moment-timezone");

export default class DateSeparator extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		let sameDay = this.sameDateAs(this.props.timestamp1, this.props.timestamp2);
		// don't show a separator if we don't have something to compare to,
		// or if the days are the same
		if (!this.props.timestamp1 || sameDay) return null;
		let dateText = this.prettyDateDay(this.props.timestamp2);
		return (
			<div className="date-separator">
				<span>{dateText}</span>
			</div>
		);
	}

	sameDateAs(time1, time2) {
		let date1 = new Date(time1);
		let date2 = new Date(time2);
		return (
			date1.getFullYear() == date2.getFullYear() &&
			date1.getMonth() == date2.getMonth() &&
			date1.getDate() == date2.getDate()
		);
	}

	addDays(date, days) {
		date.setDate(date.getDate() + days);
		return date;
	}

	prettyDateDay = function(time, options) {
		options = options || {};
		if (time === 0 || time === null || time === undefined) return "";
		var now = new Date().getTime();
		// now = this.adjustedTime(now, options.timezone_info);
		// time = this.adjustedTime(time, options.timezone_info);
		var today = new Date(now);
		var timeDay = new Date(time);

		if (this.sameDateAs(timeDay, today)) {
			return "Today";
		}
		var nextDay = this.addDays(new Date(timeDay.getTime()), 1);
		if (this.sameDateAs(nextDay, today)) {
			return "Yesterday";
		}

		if (timeDay.getFullYear() === today.getFullYear()) {
			return moment(time).format("dddd, MMMM Do");
		}
		return moment(time).format("dddd, MMMM Do, YYYY");
	};
}
