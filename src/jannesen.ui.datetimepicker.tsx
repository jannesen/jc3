/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J       from "jc3/jannesen";
import * as $JD      from "jc3/jannesen.dom";
import * as $JT      from "jc3/jannesen.datatype";
import * as $JTE     from "jc3/jannesen.datatypeex";
import * as $JI      from "jc3/jannesen.input";
import * as $JIE     from "jc3/jannesen.inputex";
import * as $JR      from "jc3/jannesen.regional";
import * as $JL      from "jc3/jannesen.language";
import * as $JPOPUP  from "jc3/jannesen.ui.popup";

const MinDate        = $J.newDate(1900,  1,  1);
const MaxDate        = $J.newDate(2100, 12, 31);
const TicksPerMinute = 60*1000;
const TicksPerHour   = 60*TicksPerMinute;
const TicksPerDay    = 24*TicksPerHour;

export enum PickerMode
{
    DateOnly        = 1,
    TimeOnly,
    TimeSpan,
    DateTime
}

export class YearMonth
{
    public  readonly    Year:               number;
    public  readonly    Month:              number;

    public  get         Ticks()
    {
        return (this.Year * 12) + (this.Month - 1);
    }
    public  get         FirstDay()
    {
        return $J.newDate(this.Year, this.Month, 1);
    }
    public  get         LastDay()
    {
        return $J.newDate(this.Year, this.Month+1, 1) - 1;
    }

                        constructor(year: number, month: number)
    {
        this.Year  = year;
        this.Month = month;
    }

    public static       FromDate(date:number)
    {
        const parts  = $J.dateParts(date);

        return new YearMonth(parts.Year, parts.Month);
    }
    public static       FromTicks(ticks:number)
    {
        ticks = Math.round(ticks);
        return new YearMonth(toInt(ticks / 12), (ticks % 12) + 1);
    }
}

export interface ValueMinMax
{
    Value:      number|null;
    MinValue:   number;
    MaxValue:   number;
}
export interface ValueMinMaxNotNull
{
    Value:      number;
    MinValue:   number;
    MaxValue:   number;
}

export interface DatePickerState
{
    Mode:               PickerMode;
    Value:              ValueMinMax;
    Range?:             number|null;
}

export interface ClickEvent
{
    value?:     number|null;
    event?:     KeyboardEvent|MouseEvent;
}

export class DatePicker implements $JD.IDOMContainer,$J.EventHandling
{
    private         _container:     $JD.DOMHTMLElement;
    private         _body:          $JD.DOMHTMLElement;
    private         _hdrBtnPrev:    $JD.DOMHTMLElement;
    private         _hdrBtnNext:    $JD.DOMHTMLElement;
    private         _hdrTitle:      $JD.DOMHTMLElement;
    private         _state:         DatePickerState|undefined;
    private         _views:         ViewBase[];
    private         _activeView:    ViewBase|null;
    private         _today:         number|undefined;

    public  get     activeView()
    {
        return this._activeView;
    }

    public  get     value()
    {
        return this.State.Value.Value;
    }

    public  get     State():DatePickerState
    {
        if (!this._state) {
            throw new $J.InvalidStateError("State not set.");
        }

        return this._state;
    }
    public  set     State(state:DatePickerState)
    {
        state = { ...state };
        this._state = state;

        switch (state.Mode) {
        case PickerMode.DateOnly:
            this.getView<MonthView>(MonthView).initDate(state.Value, state.Range);
            break;

        case PickerMode.TimeOnly:
            this.getView<DayView>(DayView).initTime(state.Value);
            break;

        case PickerMode.TimeSpan:
            this.getView<TimeView>(TimeView).init(5*TicksPerMinute, 2*TicksPerHour, state.Value);
            break;

        case PickerMode.DateTime:
            this.getView<MonthView>(MonthView).initTime(state.Value);
            break;
        }
    }

    public  get     container()
    {
        return this._container;
    }

    public  get     ToDay() {
        return (this._today === undefined) ? this._today = $J.curDate() : this._today;
    }

                    constructor()
    {
        this._container =   <div class="jannesen-ui-datetimepicker">
                                <div class="-header">
                                    { this._hdrBtnPrev = <span class="-btn -prev -clickable" onclick={()=>this._navigateTo(this._hdrBtnPrev)} /> }
                                    { this._hdrBtnNext = <span class="-btn -next -clickable" onclick={()=>this._navigateTo(this._hdrBtnNext)} /> }
                                    { this._hdrTitle   = <span class="-title -clickable"     onclick={()=>this._navigateDown()              } /> }
                                </div>
                                { this._body = <div class="-body" /> }
                            </div>;
        this._state      = undefined;
        this._views      = [];
        this._activeView = null;
    }

    // #region mixin $J.EventHandling
    public _eventHandlers!:      $J.IEventHandlerCollection;
    public bind(eventName:'click', handler: (ev:ClickEvent|undefined)=>void, thisArg?:any): void;
    public bind(eventName:string,  handler: (ev?:any)=>void,                 thisArg?:any): void        { throw new $J.InvalidStateError("Mixin not applied."); }
    public unbind(eventName:string, handler: (ev?:any)=>void, thisArg?:any): void                       { throw new $J.InvalidStateError("Mixin not applied."); }
    public trigger(eventName:'click', ev:ClickEvent|undefined): void;
    public trigger(eventName:string,  data?:any): void                                                  { throw new $J.InvalidStateError("Mixin not applied."); }
    // #endregion

    public          onKeyDown(ev:KeyboardEvent)
    {
        if (this._activeView) {
            if (!(ev.altKey || ev.ctrlKey || ev.metaKey)) {
                switch(ev.key) {
                case "PageUp":      this._navigateTo(this._hdrBtnPrev); return;
                case "PageDown":    this._navigateTo(this._hdrBtnNext); return;
                }
            }

            this._activeView.onKeyDown(ev);
        }
    }
    public          setHeader(view:ViewBase, prevValue:number|null, nextValue:number|null, title:string)
    {
        if (view === this._activeView) {
            this._hdrBtnPrev.data("value", prevValue).toggleClass("-clickable", prevValue !== null);
            this._hdrBtnNext.data("value", nextValue).toggleClass("-clickable", nextValue !== null);
            this._hdrTitle.text(title);
        }
    }
    public          getView<T extends ViewBase>(cls: (new (picker:DatePicker)=>T)):T
    {
        let view = this._views.find((v) => v instanceof cls) as T;

        if (!view) {
            view = new cls(this);

            if (!this._activeView) {
                view.setVisible(true);
            }

            this._body.appendChild(view);
            this._views.push(view);
        }

        this._activeView = view;

        if (this._views[0] !== view) {
            $J.setTimeout(() => { view.setVisible(true); }, 10);
        }

        return view;
    }
    public          close(event?:KeyboardEvent|MouseEvent)
    {
        this.trigger('click', { event });
    }
    public          setDate(value:number, event?:KeyboardEvent|MouseEvent)
    {
        const state = this.State;
        switch (state.Mode) {
        case PickerMode.DateOnly:
            if (value === null || state.Value.MinValue <= value && value <= state.Value.MaxValue) {
                state.Value.Value = value;
                this.trigger('click', { value, event });
            }
            break;

        case PickerMode.DateTime:
            this.getView<DayView>(DayView).initDate(value, state.Value);
            break;
        }
    }
    public          setTime(value:number, event:KeyboardEvent|MouseEvent)
    {
        const state = this.State;
        switch (state.Mode) {
        case PickerMode.TimeOnly:
        case PickerMode.TimeSpan:
        case PickerMode.DateTime:
            if (state.Value.MinValue <= value && value <= state.Value.MaxValue) {
                state.Value.Value = value;
                this.trigger('click', { value, event });
            }
            break;
        }
    }
    public          setRange(range:number|null) // setRange is currently only implented for DateOnly
    {
        switch (this.State.Mode) {
        case PickerMode.DateOnly:
            this.getView<MonthView>(MonthView).setRange(range);
            break;
        }
    }

    private         _navigateTo(btn:$JD.DOMHTMLElement)
    {
        const value = btn.data('value');
        if (typeof value === 'number' && this._activeView) {
            this._activeView.navigateTo(value);
        }
    }
    private         _navigateDown() {
        if (this._activeView) {
            this._activeView.viewDown();
        }
    }
}
$J.applyMixins(DatePicker, [$J.EventHandling]);

//===================================== Dropdown ==================================================
export abstract class InputDropdown<TValue extends $JT.SimpleType<number>,
                                    TInput extends $JI.InputTextControl<number, TValue, TInput, TOpts, $JI.IDropdownStdData>,
                                    TOpts extends $JI.IInputControlOptions,
                                    TDropdown extends InputDropdown<TValue, TInput, TOpts, TDropdown>>
                                        extends $JPOPUP.DropdownContent<number, TInput, $JI.IDropdownStdData, number|null>
{
    protected       _datepicker!:       DatePicker;

    protected       Init(state:DatePickerState, minValue:number, maxValue:number)
    {
        this._datepicker = new DatePicker();
        this._datepicker.bind('click',  (ev) => {
                                    const input = this.control;

                                    if (input) {
                                        const value = ev && ev.value;

                                        if (value === undefined) {
                                            this.Close(undefined, (ev ? ev.event : undefined));
                                        }
                                        else if (value === null || (minValue <= value && maxValue >= value)) {
                                            this.Close(value, (ev ? ev.event : undefined));
                                        }
                                    }
                                });

        this._datepicker.State = state;
        this.setContent(this._datepicker);
        this.container!.bind('keydown',  (ev) => { this._datepicker.onKeyDown(ev); });
    }

    public          allwaysCenterDropdown()
    {
        return true;
    }
}

export class DateInputDropdown extends InputDropdown<$JT.Date, $JI.Date, $JI.IDateControlOptions, DateInputDropdown>
{
                    constructor(popup:$JPOPUP.DropdownPopup<number, $JI.Date, $JI.IDropdownStdData>)
    {
        super(popup);
    }

    public          OnLoad()
    {
        const value       = this.control!.value!;
        const nativeValue = value.value;
        let minValue      = value.MinValue;
        let maxValue      = value.MaxValue;
        if (typeof minValue !== 'number') minValue = MinDate;
        if (typeof maxValue !== 'number') maxValue = MaxDate;

        this.Init({
                        Mode:   PickerMode.DateOnly,
                        Value:  {
                                    Value:          nativeValue,
                                    MinValue:       minValue,
                                    MaxValue:       maxValue
                                }
                    }, minValue, maxValue);
    }
}

export class DateTimeInputDropdown extends InputDropdown<$JT.DateTime, $JI.DateTime, $JI.IDateTimeControlOptions, DateTimeInputDropdown>
{
                    constructor(popup:$JPOPUP.DropdownPopup<number, $JI.DateTime, $JI.IDropdownStdData>)
    {
        super(popup);
    }

    public          OnLoad()
    {
        const value       = this.control!.value!;
        const nativeValue = value.value;
        let minValue    = value.MinValue;
        let maxValue    = value.MaxValue;
        if (typeof minValue !== 'number') minValue = MinDate * TicksPerDay;
        if (typeof maxValue !== 'number') maxValue = MaxDate * TicksPerDay;

        this.Init({
                        Mode:   PickerMode.DateTime,
                        Value:  {
                                    Value:          nativeValue,
                                    MinValue:       minValue,
                                    MaxValue:       maxValue
                                }
                    }, minValue, maxValue);
    }
}

export class TimeInputDropdown extends InputDropdown<$JT.Time, $JI.Time, $JI.ITimeControlOptions, TimeInputDropdown>
{
                    constructor(popup:$JPOPUP.DropdownPopup<number, $JI.Time, $JI.IDropdownStdData>)
    {
        super(popup);
    }

    public          OnLoad()
    {
        const value       = this.control!.value!;
        const nativeValue = value.value;
        let minValue    = value.MinValue;
        let maxValue    = value.MaxValue;
        if (typeof minValue !== 'number') minValue = 0;
        if (typeof maxValue !== 'number') maxValue = 1000*TicksPerDay;

        this.Init({
                        Mode:   (minValue === 0 && (maxValue >= TicksPerDay-TicksPerMinute && maxValue <= TicksPerDay)) ? PickerMode.TimeOnly : PickerMode.TimeSpan,
                        Value:  {
                                    Value:          nativeValue,
                                    MinValue:       minValue,
                                    MaxValue:       maxValue
                                }
                    }, minValue, maxValue);
    }
}

export abstract class RangeInputDropdown<TValue extends $JTE.RangeValue<TInput>,
                                         TInput extends $JI.InputTextControl<$JTE.IRangeValue, TValue, TInput, TOpt, void, $JTE.IRangeValue|null, TDropdown>,
                                         TOpt extends $JI.IInputControlOptions,
                                         TDropdown extends $JPOPUP.DropdownContent<$JTE.IRangeValue, TInput, void, $JTE.IRangeValue|null>>
                                            extends $JPOPUP.DropdownContent<$JTE.IRangeValue, TInput, void, $JTE.IRangeValue|null>
{
    protected       _from!: DatePicker;
    protected       _to!:   DatePicker;

    public          OnLoad() {
        this._from = new DatePicker();
        this._to   = new DatePicker();
        const self        = this;
        let active      = this._from;
        let fromclicked = false;
        let toclicked   = false;

        this._from.bind('click', (ev) => {
                fromclicked = true;
                rtnrange(self._to, ev);
            });
        this._to.bind('click', (ev) => {
                toclicked = true;
                rtnrange(self._from, ev);
            });

        this.setContent(<div class="jannesen-ui-range-calendar-container" tabIndex="1">
                            { this._from }
                            { this._to   }
                        </div>);

        this.container!.bind('keydown', (ev) => {
                switch (ev.key) {
                case "Escape":
                    this.Close(undefined, ev);
                    break;
                default:
                    active.onKeyDown(ev);
                    break;
                }
            });
        this.initState(this.control!.value!);

        function rtnrange(datePicker:DatePicker, ev:ClickEvent|undefined)
        {
            const input = self.control;
            if (input) {
                const dtvalue = input.value;
                if (dtvalue) {
                    if (ev) {
                        const value = ev.value;
                        if (value) {
                            (active = datePicker).setRange(value);

                            const begin = self._from.value;
                            const end   = self._to.value;

                            if (ev.event && ev.event.type === 'dblclick') {
                                if (typeof value === 'number') {
                                    fromclicked = true;
                                    toclicked   = true;

                                    if (typeof begin !== 'number' || typeof end !== 'number') {
                                        self.rtnValue(dtvalue, value, value, ev.event);
                                        return;
                                    }
                                }
                            }

                            if (fromclicked && toclicked) {
                                if (typeof begin === 'number' && typeof end === 'number' && begin <= end) {
                                    self.rtnValue(dtvalue, begin, end, ev.event);
                                }
                            }
                        }
                    }
                    else {
                        self.Close(undefined, undefined);
                    }
                }
            }
        }
    }

    protected abstract  initState(value:TValue): void;
    protected abstract  rtnValue(value:TValue, begin:number, end:number, ev:Event|undefined): void;
}

export class DateRangeInputDropdown extends RangeInputDropdown<$JTE.DateRange, $JIE.DateRange, $JIE.IDateRangeControlOptions, DateRangeInputDropdown>
{
    protected           initState(value:$JTE.DateRange) {
        let minValue    = value.MinValue;   if (typeof minValue !== 'number') minValue = MinDate;
        let maxValue    = value.MaxValue;   if (typeof maxValue !== 'number') maxValue = MaxDate;
        const nativeValue = value.value;
        this._from.State = {
                                Mode:   PickerMode.DateOnly,
                                Value: {
                                    Value:      nativeValue ? nativeValue.Begin : null,
                                    MinValue:   minValue,
                                    MaxValue:   maxValue
                                },
                                Range:  nativeValue ? nativeValue.End : null
                           };
        this._to.State   = {
                                Mode:   PickerMode.DateOnly,
                                Value:  {
                                    Value:      nativeValue ? nativeValue.End : null,
                                    MinValue:   minValue,
                                    MaxValue:   maxValue
                                },
                                Range:  nativeValue ? nativeValue.Begin : null
                           };
    }

    protected           rtnValue(value:$JTE.DateRange, begin:number, end:number, ev:Event|undefined): void {
        const minValue    = value.MinValue;
        const maxValue    = value.MaxValue;

        if ((minValue === undefined || minValue <= begin) &&
            (maxValue === undefined || maxValue >= end)) {
            this.Close({ Begin: begin, End: end }, ev);
        }
    }
}

export class DateTimeRangeInputDropdown extends RangeInputDropdown<$JTE.DateTimeRange, $JIE.DateTimeRange, $JIE.IDateTimeRangeControlOptions, DateTimeRangeInputDropdown>
{
    protected           initState(value:$JTE.DateTimeRange) {
        const minValue    = typeof value.MinValue === 'number' ? Math.floor(value.MinValue       / 86400000) : MinDate;
        const maxValue    = typeof value.MaxValue === 'number' ? Math.floor((value.MaxValue - 1) / 86400000) : MaxDate;
        let   begin:number|null = null;
        let   end:number|null   = null;

        const nativeValue = value.value;
        if (nativeValue) {
            begin = nativeValue.Begin;
            end   = nativeValue.End;

            const timezone = value.TimeZone;
            if (timezone) {
                begin = timezone.UtcToLocal(begin);
                end   = timezone.UtcToLocal(end);
            }

            begin = typeof begin === 'number' ? Math.floor(begin     / 86400000) : null;
            end   = typeof end   === 'number' ? Math.floor((end - 1) / 86400000) : null;
        }

        this._from.State = {
                                Mode:   PickerMode.DateOnly,
                                Value: {
                                    Value:      begin,
                                    MinValue:   minValue,
                                    MaxValue:   maxValue
                                },
                                Range:  end
                           };
        this._to.State   = {
                                Mode:   PickerMode.DateOnly,
                                Value:  {
                                    Value:      end,
                                    MinValue:   minValue,
                                    MaxValue:   maxValue
                                },
                                Range:  begin
                           };
    }

    protected           rtnValue(value:$JTE.DateTimeRange, begin:number, end:number, ev:Event|undefined): void {
        const minValue    = value.MinValue;
        const maxValue    = value.MaxValue;

        begin = begin     * 86400000;
        end   = (end + 1) * 86400000;

        const timezone = value.TimeZone;
        if (timezone) {
            begin = timezone.LocalToUtc(begin);
            end   = timezone.LocalToUtc(end);
        }

        if ((minValue === undefined || minValue <= begin) &&
            (maxValue === undefined || maxValue >= end)) {
            this.Close({ Begin: begin, End: end }, ev);
        }
    }
}

//===================================== View ======================================================
export interface ViewState
{
    sizeX:              number;
    sizeY:              number;
    selected:           number|null;
    now:                number|null;
    firstVisable:       number;
    minValue:           number;
    maxValue:           number;
    minInside?:         number;
    maxInside?:         number;
    step:               number;
}

export abstract class ViewBase implements $JD.IDOMContainer
{
    protected               _picker:        DatePicker;
    protected               _container:     $JD.DOMHTMLElement;
    protected               _cells!:        $JD.DOMHTMLElement[];
    protected               _viewState!:    ViewState;
    protected               _value!:        ValueMinMax;
    protected               _range:         number|null|undefined;

    public  get             container()
    {
        return this._container;
    }

                            constructor(picker:DatePicker, className:string)
    {
        this._picker    = picker;
        this._container = <div class={className} />;
    }

    public                  setVisible(v: boolean)
    {
        this._container.toggleClass('-visible', v);
    }

    public  abstract        navigateTo(value:number):void;
    public                  viewUp():void
    {
    }
    public                  viewDown():void
    {
    }
    public                  onKeyDown(ev:KeyboardEvent)
    {
        if (!(ev.altKey || ev.ctrlKey || ev.metaKey)) {
            switch(ev.key) {
            case "Enter":
                if (this._viewState.selected !== null && this.validValue(this._viewState.selected)) {
                    this.onClick(this._viewState.selected, ev);
                    $J.eventHandled(ev);
                }
                return;

            case "Tab":
                if (this._viewState.selected !== null && this.validValue(this._viewState.selected)) {
                    this.onClick(this._viewState.selected, ev);
                }
                else {
                    this._picker.close(ev);
                }

                $J.eventHandled(ev);
                return;

            case "Escape":      this.viewUp();                              $J.eventHandled(ev); return;
            case "F4":          this.viewDown();                            $J.eventHandled(ev); return;
            case "Home":        this.moveHome();                            $J.eventHandled(ev); return;
            case "End":         this.moveEnd();                             $J.eventHandled(ev); return;
            case "ArrowLeft":   this.movePrevNext(-1);                      $J.eventHandled(ev); return;
            case "ArrowRight":  this.movePrevNext( 1);                      $J.eventHandled(ev); return;
            case "ArrowUp":     this.movePrevNext(-this._viewState.sizeX);  $J.eventHandled(ev); return;
            case "ArrowDown":   this.movePrevNext( this._viewState.sizeX);  $J.eventHandled(ev); return;
            }
        }
    }
    public                  restore()
    {
        this.stateChanged(true);
    }

    public                  setRange(range:number)
    {
        this._range = range;
        this._selectRange(this._cells);
    }
    protected               setViewState(state:ViewState)
    {
        let table:$JD.DOMHTMLElement|null = null;
        let cells = this._cells;

        if (!(cells instanceof Object && this._viewState.sizeX === state.sizeX && this._viewState.sizeY === state.sizeY)) {
            table = <table/>;
            cells = [];
            table.appendChild(this.tableHeader());

            for(let j = 0 ; j < state.sizeY ; ++j) {
                const tr = <tr/>;

                for(let i = 0 ; i < state.sizeX ; ++i) {
                    const c  = <td/>;
                    cells.push(c);
                    tr.appendChild(c);
                }

                table.appendChild(tr);
            }

            table.bind("click", this._onTableClick, this);
            table.bind("dblclick", this._onTableClick, this);
        }

        let v = state.firstVisable;

        cells.forEach((cell) => {
                                    if (cell.data('value') !== v) {
                                        cell.text(this.toText(v));
                                        cell.data("value", v);
                                    }

                                    cell.toggleClass("-selected",  (typeof state.selected === 'number') && v <= state.selected && state.selected < v + state.step);
                                    cell.toggleClass("-now",       (typeof state.now      === 'number') && v <= state.now      && state.now      < v + state.step);
                                    cell.toggleClass("-outside",   (typeof state.minInside === 'number' && typeof state.maxInside === 'number') && (state.minInside > v || v > state.maxInside));
                                    cell.toggleClass("-clickable", state.minValue <= v && v <= state.maxValue);
                                    v += state.step;
                                });
        this._selectRange(cells);

        if (table) {
            this._container.empty().appendChild(table);
        }

        this._cells     = cells;
        this._viewState = { ...state };
    }

    protected               tableHeader():$JD.DOMHTMLElement|null
    {
        return null;
    }
    protected               toText(value:number)
    {
        return value.toString();
    }

    protected   abstract    onClick(value:number, ev:KeyboardEvent|MouseEvent):void;
    protected               moveHome()
    {
        let value = this._viewState.firstVisable;
        if (typeof this._viewState.minInside === 'number' && value < this._viewState.minInside)  value = this._viewState.minInside;
        if (typeof this._viewState.minValue  === 'number' && value < this._viewState.minValue)   value = this._viewState.minValue;

        if (this.validValue(value)) {
            this.setSelected(value);
        }
    }
    protected               moveEnd()
    {
        let value = this._viewState.firstVisable + ((this._cells.length - 1) * this._viewState.step);
        if (typeof this._viewState.maxInside === 'number' && value > this._viewState.maxInside)  value = this._viewState.maxInside;
        if (typeof this._viewState.maxValue  === 'number' && value > this._viewState.maxValue)   value = this._viewState.maxValue;

        if (this.validValue(value)) {
            this.setSelected(value);
        }
    }
    protected               movePrevNext(d:number)
    {
        const step  = this._viewState.step;
        let   first = this._viewState.firstVisable;
        let   last  = this._viewState.firstVisable + ((this._cells.length - 1) * step);
        let   value = this._viewState.selected;

        if (value !== null && first <= value && value < first + (this._cells.length * step)) {
            const r = value % this._viewState.step;
            if (r !== 0) {
                value -= r + ((r > this._viewState.step/2) ? this._viewState.step : 0);
            }
            value = value + (d * this._viewState.step);
        } else {
            if (typeof this._viewState.minInside === 'number' && first < this._viewState.minInside)  first = this._viewState.minInside;
            if (typeof this._viewState.maxInside === 'number' && last  > this._viewState.maxInside)  last  = this._viewState.maxInside;

            if (d>0)
                value = first;
            else
            if (d<0)
                value = last;
            else
                value = first + toInt(((last-first) / step) / 2) * step;
        }

        if (typeof this._viewState.minValue === 'number' && value < this._viewState.minValue)   value = this._viewState.minValue;
        if (typeof this._viewState.maxValue === 'number' && value > this._viewState.maxValue)   value = this._viewState.maxValue;

        if (value !== this._viewState.selected && this.validValue(value)) {
            this.setSelected(value);
        }
    }

    public      abstract    setSelected(value:number):void;
    protected   abstract    stateChanged(updheader:boolean):void;
    protected               validValue(value:number|null|undefined): value is number
    {
        return typeof value === 'number' && this._value.MinValue <= value && value <= this._value.MaxValue;
    }
    protected               _selectRange(cells:$JD.DOMHTMLElement[])
    {
        if (typeof this._range === 'number' && typeof this._value.Value === 'number') {
            const minValue = Math.min(this._value.Value, this._range);
            const maxValue = Math.max(this._value.Value, this._range);

            cells.forEach(cell => {
                const value = cell.data<number>('value');
                cell.toggleClass('-range-selected', minValue <= value && value <= maxValue);
            });
        }
    }

    private                 _onTableClick(ev:MouseEvent)
    {
        let     elmtd = ev.target as (HTMLElement|null);

        while (elmtd instanceof HTMLElement && elmtd.tagName !== "TD")
            elmtd = elmtd.parentElement;

        if (elmtd !== null) {
            const cell = this._cells.find((c) => (c && c.element === elmtd));

            if (cell && cell.hasClass("-clickable")) {
                const value = cell.data<number>("value");

                if (this.validValue(value)) {
                    this.setSelected(value);
                    this.onClick(value, ev);
                }
            }
        }
    }
}

class MonthView extends ViewBase
{
    private         _month!:    ValueMinMaxNotNull;

                    constructor(picker:DatePicker)
    {
        super(picker, "-month");
    }

    public          initTime(time:ValueMinMax)
    {
        this.initDate({
                            Value:      typeof time.Value === 'number' ? toInt(time.Value / TicksPerDay) : null,
                            MinValue:   toInt(time.MinValue / TicksPerDay),
                            MaxValue:   toInt((time.MaxValue + (TicksPerDay -TicksPerMinute)) / TicksPerDay)
                      });
    }
    public          initDate(date:ValueMinMax, range?:number|null)
    {
        this._value = { ...date };
        this._range = range;
        this._month = {
                            Value:      YearMonth.FromDate(typeof date.Value === 'number' ? date.Value : this._picker.ToDay).Ticks,
                            MinValue:   YearMonth.FromDate(date.MinValue).Ticks,
                            MaxValue:   YearMonth.FromDate(date.MaxValue).Ticks
                      };
        this.stateChanged(true);
    }
    public          navigateTo(value:number)
    {
        this._month.Value = value;
        this.stateChanged(true);
    }
    public          viewUp()
    {
        this._picker.close();
    }
    public          viewDown()
    {
        this._picker.getView<YearView>(YearView).init(this._month);
    }
    public          setRange(range:number|null)
    {
        this._range = range;
        this.stateChanged(false);
    }

    protected       tableHeader():$JD.DOMHTMLElement
    {
        return <tr class="-header">{ $JL.dayNamesMin.map((dn, d) => <td>{ firstCapital($JL.dayNamesMin[($JR.firstDay + d) % 7]) }</td>) }</tr>;
    }
    protected       toText(value:number)
    {
        return $J.datetimeFromDate(value).getUTCDate().toString();
    }
    protected       onClick(value:number, event:KeyboardEvent|MouseEvent)
    {
        this._picker.setDate(value, event);
    }
    public          setSelected(value:number)
    {
        this._value.Value = value;
        if ((typeof this._viewState.minInside === 'number' && typeof this._viewState.maxInside === 'number') &&
            (this._viewState.minInside > value || value > this._viewState.maxInside)) {
            this._month.Value = YearMonth.FromDate(value).Ticks;
        }
        this.stateChanged(false);
    }
    protected       stateChanged(setHeader:boolean)
    {
        const yearMonth = YearMonth.FromTicks(this._month.Value);
        let   firstDay  = yearMonth.FirstDay - 1;

        while ($J.getDateDay(firstDay) !== $JR.firstDay)
            --firstDay;

        if (setHeader || this._viewState.firstVisable !== firstDay) {
            const prevValueTicks = this._month.Value - 1;
            const nextValueTicks = this._month.Value + 1;
            this._picker.setHeader(this,
                                   this._validMonth(prevValueTicks),
                                   this._validMonth(nextValueTicks),
                                   $JL.monthNames[yearMonth.Month-1] + " " + yearMonth.Year);
        }

        this.setViewState({
                                sizeX:              7,
                                sizeY:              6,
                                selected:           this._value.Value,
                                now:                this._picker.ToDay,
                                firstVisable:       firstDay,
                                minValue:           this._value.MinValue,
                                maxValue:           this._value.MaxValue,
                                minInside:          yearMonth.FirstDay,
                                maxInside:          yearMonth.LastDay,
                                step:               1
                          });
    }

    private         _validMonth(month:number)
    {
        return this._month.MinValue <= month && month <= this._month.MaxValue ? month : null;
    }
}

class YearView extends ViewBase
{
    private         _year!:     ValueMinMaxNotNull;

                    constructor(picker:DatePicker)
    {
        super(picker, "-year");
    }

    public          init(month:ValueMinMaxNotNull)
    {
        this._value = { ...month };
        this._year  = {
                            Value:      toInt(month.Value    / 12),
                            MinValue:   toInt(month.MinValue / 12),
                            MaxValue:   toInt(month.MaxValue / 12)
                      };
        this.stateChanged(true);
    }
    public          navigateTo(value:number)
    {
        this._year.Value = value;
        this._value.Value = Math.max(this._value.MinValue, Math.min(this._value.MaxValue, (value*12) + (this._value.Value! % 12)));
        this.stateChanged(true);
    }
    public          viewUp()
    {
        this._picker.getView<MonthView>(MonthView).restore();
        this.setVisible(false);
    }
    public          viewDown()
    {
        this._picker.getView<DecadeView>(DecadeView).init(this._year);
    }

    protected       toText(value:number)
    {
        return firstCapital($JL.monthNamesShort[value % 12]);
    }
    protected       onClick(value:number, event:KeyboardEvent|MouseEvent)
    {
        this._picker.getView<MonthView>(MonthView).navigateTo(value);
        this.setVisible(false);
    }
    public          setSelected(value:number)
    {
        this._value.Value = value;
        this._year.Value  = toInt(value / 12);
        this.stateChanged(false);
    }
    protected       stateChanged(setHeader:boolean)
    {
        if (setHeader || this._viewState.firstVisable !== this._year.Value * 12) {
            this._picker.setHeader(this,
                                   this._validYear(this._year.Value - 1),
                                   this._validYear(this._year.Value + 1),
                                   this._year.Value.toString());
        }

        this.setViewState({
                                sizeX:              3,
                                sizeY:              4,
                                selected:           this._value.Value,
                                now:                YearMonth.FromDate(this._picker.ToDay).Ticks,
                                firstVisable:       this._year.Value * 12,
                                minValue:           this._value.MinValue,
                                maxValue:           this._value.MaxValue,
                                step:               1
                          });
    }

    private         _validYear(year:number)
    {
        return this._year.MinValue <= year && year <= this._year.MaxValue ? year : null;
    }
}

class DecadeView extends ViewBase
{
    private         _firstVisible!: number;

                    constructor(picker:DatePicker)
    {
        super(picker, "-decade");
    }

    public          init(year:ValueMinMaxNotNull)
    {
        this._value     = { ...year };
        this._firstVisible = year.Value - 12;
        this.stateChanged(true);
    }
    public          navigateTo(value:number)
    {
        this._firstVisible = value;
        this.stateChanged(true);
    }
    public          viewUp()
    {
        this._picker.getView<YearView>(YearView).restore();
        this.setVisible(false);
    }

    protected       toText(value:number)
    {
        return value.toString();
    }
    protected       onClick(value:number, event:KeyboardEvent|MouseEvent)
    {
        this._picker.getView<YearView>(YearView).navigateTo(value);
        this.setVisible(false);
    }
    public          setSelected(value:number)
    {
        this._value.Value = value;

        while (this._firstVisible > value)
            this._firstVisible -= 4;

        while (this._firstVisible + this._cells.length <= value)
            this._firstVisible += 4;

        this.stateChanged(false);
    }
    protected       stateChanged(setHeader:boolean)
    {
        if (setHeader || this._viewState.firstVisable !== this._firstVisible) {
            this._picker.setHeader(this,
                                   this._validFirstVisible(this._firstVisible - 16),
                                   this._validFirstVisible(this._firstVisible + 16),
                                   this._firstVisible.toString() + "-" + (this._firstVisible + 15).toString());
        }

        this.setViewState({
                                sizeX:              4,
                                sizeY:              4,
                                selected:           this._value.Value,
                                now:                YearMonth.FromDate(this._picker.ToDay).Year,
                                firstVisable:       this._firstVisible,
                                minValue:           this._value.MinValue,
                                maxValue:           this._value.MaxValue,
                                step:               1
                          });
    }

    private         _validFirstVisible(firstVisible:number)
    {
        return this._value.MinValue < (firstVisible + 16) && firstVisible < this._value.MaxValue ? firstVisible : null;
    }
}

class DayView extends ViewBase
{
    private         _firstValue!:number;

                    constructor(picker:DatePicker)
    {
        super(picker, "-day");
    }

    public          initTime(time:ValueMinMax)
    {
        this._firstValue = typeof time.Value === 'number' ? time.Value - time.Value % TicksPerDay : 0;
        this._value      = { ...time };
        this.stateChanged(true);
    }
    public          initDate(date:number, time:ValueMinMax)
    {
        this._firstValue = toInt(date*TicksPerDay);
        this._value      = {
                                Value:      typeof time.Value === 'number' ? this._firstValue + (time.Value % TicksPerDay) : null,
                                MinValue:   time.MinValue,
                                MaxValue:   time.MaxValue
                           };
        this.stateChanged(true);
    }
    public          navigateTo(value:number)
    {
        this._firstValue = value;
        this.stateChanged(true);
    }
    public          viewUp():void
    {
        if (this._picker.State.Mode !== PickerMode.DateTime) {
            this._picker.close();
        } else {
            this.viewDown();
        }
    }
    public          viewDown():void
    {
        if (this._picker.State.Mode === PickerMode.DateTime) {
            this._picker.getView<MonthView>(MonthView).initTime({
                                                                    Value:      this._firstValue,
                                                                    MinValue:   this._value.MinValue,
                                                                    MaxValue:   this._value.MaxValue
                                                                });
            this.setVisible(false);
        }
    }

    protected       toText(value:number)
    {
        return $J.intToA(toInt((value / TicksPerHour) % 24), 2) + ":xx";
    }
    protected       onClick(value:number)
    {
        this._picker.getView<TimeView>(TimeView).init(5*TicksPerMinute, TicksPerHour, this._value);
    }
    public          setSelected(value:number)
    {
        this._firstValue  = value - (value % TicksPerDay);
        this._value.Value = value;
        this.stateChanged(false);
    }
    protected       stateChanged(setHeader:boolean)
    {
        if (setHeader || this._firstValue !== this._viewState.firstVisable) {
            this._picker.setHeader(this,
                                   this._validFirstVisible(this._firstValue - TicksPerDay),
                                   this._validFirstVisible(this._firstValue + TicksPerDay),
                                   this._picker.State.Mode === PickerMode.DateTime ? $JR.dateToString(this._firstValue / TicksPerDay) : "00:00-24:00");
        }

        this.setViewState({
                                sizeX:              4,
                                sizeY:              6,
                                selected:           this._value.Value,
                                now:                null,
                                firstVisable:       this._firstValue,
                                minValue:           this._value.MinValue,
                                maxValue:           this._value.MaxValue,
                                step:               TicksPerHour
                          });
    }

    private         _validFirstVisible(firstVisible:number)
    {
        return this._picker.State.Mode === PickerMode.DateTime && this._value.MinValue < firstVisible + TicksPerDay && firstVisible <= this._value.MaxValue ? firstVisible : null;
    }
}

class TimeView extends ViewBase
{
    private         _step!:         number;
    private         _timespan!:     number;
    private         _firstVisible!: number;

                    constructor(picker:DatePicker)
    {
        super(picker, "-time");
    }

    public          init(step:number, timespan:number, time:ValueMinMax)
    {
        this._step     = step;
        this._timespan = timespan;
        this._value = {
                        Value:      null,
                        MinValue:   time.MinValue,
                        MaxValue:   time.MaxValue,
                      };
        this._firstVisible = typeof time.Value === 'number' && time.Value > 0 ? toInt(time.Value / timespan) * timespan : 0;
        this.stateChanged(true);
    }
    public          navigateTo(value:number)
    {
        this._firstVisible = value;
        this.stateChanged(true);
    }
    public          viewUp()
    {
        if (this._picker.State.Mode === PickerMode.TimeSpan) {
            this._picker.close();
        } else {
            this._picker.getView<DayView>(DayView).setVisible(true);
            this.setVisible(false);
        }
    }
    public          viewDown()
    {
        if (this._picker.State.Mode !== PickerMode.TimeSpan) {
            this._picker.getView<DayView>(DayView).initTime({
                                                                Value:      this._firstVisible,
                                                                MinValue:   this._value.MinValue,
                                                                MaxValue:   this._value.MaxValue
                                                            });
            this.setVisible(false);
        }
    }

    protected       toText(value:number)
    {
        let m = value / TicksPerMinute;

        if (this._picker.State.Mode === PickerMode.DateTime) {
            m = m % (24 * 60);
        }

        return $J.intToA(toInt(m / 60), 2) + ":" + $J.intToA(m % 60, 2);
    }
    protected       onClick(value:number, event:KeyboardEvent|MouseEvent)
    {
        this._picker.setTime(value, event);
    }
    public          setSelected(value:number)
    {
        this._value.Value = value;
        this._firstVisible  = toInt(value / this._timespan) * this._timespan;
        this.stateChanged(false);
    }
    protected       stateChanged(setHeader:boolean)
    {
        if (setHeader || this._viewState.firstVisable !== this._firstVisible) {
            this._picker.setHeader(this,
                                   this._validFirstVisible(this._firstVisible - this._timespan),
                                   this._validFirstVisible(this._firstVisible + this._timespan),
                                   (this._picker.State.Mode === PickerMode.DateTime
                                        ? $JR.dateToString(this._firstVisible / TicksPerDay) + " " +
                                          $J.intToA(toInt(toInt(this._firstVisible / TicksPerHour) % 24), 2) + ":xx"
                                        : this.toText(Math.max(this._firstVisible,                               this._value.MinValue)) + "-" +
                                          this.toText(Math.min(this._firstVisible + this._timespan - this._step, this._value.MaxValue))));
        }

        this.setViewState({
                                sizeX:              4,
                                sizeY:              (this._firstVisible === TicksPerDay-TicksPerHour && this._timespan === TicksPerHour && this._value.MaxValue === TicksPerDay) ? 4 : toInt((this._timespan/this._step) / 4),
                                selected:           this._value.Value,
                                now:                null,
                                firstVisable:       this._firstVisible,
                                minValue:           this._value.MinValue,
                                maxValue:           this._value.MaxValue,
                                step:               this._step
                          });
    }

    private         _validFirstVisible(firstVisible:number)
    {
        return this._value.MinValue < firstVisible + this._timespan && firstVisible <= this._value.MaxValue ? firstVisible : null;
    }
}

//===================================== helpers ===================================================

function toInt(v:number)
{
    if (typeof v === 'number') {
        v = (v>0) ? Math.floor(v) : Math.ceil(v);
    }

    return v;
}
function firstCapital(s:string)
{
    return s.substring(0,1).toUpperCase() + s.substr(1);
}
