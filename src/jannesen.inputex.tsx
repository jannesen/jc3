/// <reference path="lib-ext.d.ts"/>
import * as $JD        from "jc3/jannesen.dom";
import * as $JTE       from "jc3/jannesen.datatypeex";
import * as $JI        from "jc3/jannesen.input";
import * as $JL        from "jc3/jannesen.language";
import * as $JDTPICKER from "jc3/jannesen.ui.datetimepicker";

//===================================== DateRange ==================================================

/**
 * !!DOC
 */
export interface IDateRangeControlOptions extends $JI.IInputControlOptions {
}

export class DateRange extends $JI.InputTextDropdownControl<$JTE.IRangeValue, $JTE.DateRange, DateRange, IDateRangeControlOptions, $JDTPICKER.DateRangeInputDropdown> implements $JD.IDOMContainer {

    constructor(range: $JTE.DateRange, opts: IDateRangeControlOptions) {
        super(range, "text", "-daterange", opts, true);
    }

    protected openDropdown(): void {
        if (this._value) {
            try {
                this.focus();
                this.parseInput(false);
                this.setError(null);
                this.getDropdown("jc3/jannesen.ui.datetimepicker:DateRangeInputDropdown", "-date", true, null);
            } catch (e) {
                this.setError(e.message);
            }
        }
    }

    protected defaultPlaceHolder(value: $JTE.DateRange): string {
        return $JL.dateRangePlaceHolder;
    }
}

//===================================== DateTimeRange ==================================================

/**
 * !!DOC
 */
export interface IDateTimeRangeControlOptions extends $JI.IInputControlOptions {
}

export class DateTimeRange extends $JI.InputTextDropdownControl<$JTE.IRangeValue, $JTE.DateTimeRange, DateTimeRange, IDateTimeRangeControlOptions, $JDTPICKER.DateTimeRangeInputDropdown> implements $JD.IDOMContainer {

    constructor(range: $JTE.DateTimeRange, opts: IDateTimeRangeControlOptions) {
        super(range, "text", "-datetimerange", opts, true);
    }

    protected openDropdown(): void {
        if (this._value) {
            try {
                this.focus();
                this.parseInput(false);
                this.setError(null);
                this.getDropdown("jc3/jannesen.ui.datetimepicker:DateTimeRangeInputDropdown", "-time", true, null);
            } catch (e) {
                this.setError(e.message);
            }
        }
    }

    protected defaultPlaceHolder(value: $JTE.DateTimeRange): string {
        return $JL.dateRangePlaceHolder;
    }
}
