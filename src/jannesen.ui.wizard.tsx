/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */

import * as $J          from "jc3/jannesen";
import * as $JT         from "jc3/jannesen.datatype";
import * as $JA         from "jc3/jannesen.async";
import * as $JD         from "jc3/jannesen.dom";
import * as $JCONTENT   from "jc3/jannesen.ui.content";

export interface IWizardDialogCallData
{
    callargs?:              $JT.Record | $JT.IRecord | $J.IUrlArgs ;
    callargsext?:           $JT.IRecord;
    data?:                  $JT.Record | $JT.IRecord | $JT.RecordSet;
    dataext?:               $JT.IRecord;
    [key: string]:          any;
}

export abstract class WizardDialog<TCall extends $JA.IAjaxCallDefinition<any, void, any>, TArgs extends IWizardDialogCallData=IWizardDialogCallData, TRtn=string> extends $JCONTENT.DialogBase<TArgs, TRtn | string | null>
{

    protected               callargs:           $JA.AjaxCallArgsType<TCall>;
    protected               data:               $JA.AjaxCallRequestType<TCall>;
    protected               steps:              Step[] = [];
    protected               saveButton:         $JD.DOMHTMLElement;
    protected               nextButton:         $JD.DOMHTMLElement;
    protected               prevButton:         $JD.DOMHTMLElement;

    protected get           interfaceSave():    TCall
    {
        throw new $J.InvalidStateError("interfaceSave not implemented.");
    }

    protected get           contentClass()      { return "jannesen-ui-template-wizard-dialog"; }

    public constructor(context:$JA.Context) {
        super(context);

        this.saveButton = <button class={$JCONTENT.std_button_save.class} onclick={() => this.cmdSave()}>{$JCONTENT.std_button_save.text}</button>;
        this.prevButton = <button class={$JCONTENT.std_button_prev.class} onclick={() => this.switch(false)}>{$JCONTENT.std_button_prev.text}</button>;
        this.nextButton = <button class={$JCONTENT.std_button_next.class} onclick={() => this.switch(true)}>{$JCONTENT.std_button_next.text}</button>;

        let interfaceSave = this.interfaceSave;
        this.callargs = (interfaceSave.callargs_type) ? (new interfaceSave.callargs_type()) : undefined;
        this.data = (interfaceSave.request_type) ? (new interfaceSave.request_type()) as any : undefined;
    }

    protected               onload() {
    }

    protected               onopen(args: TArgs, ct: $JA.Context) {
        this.copyData(true, this.args, this.callargs, this.data);

        let title = this.formTitle();
        let body = this.formBody(this.callargs, this.data);
        let footer = this.formFooter();

        let first = this.steps[0];
        first.container.show(true);
        first.setActive();

        this.nextButton.show(true);

        this.content.appendChild(<div class="-header -dialog-move-target"><span class="-title">{title}</span></div>,
            <div class="-body"                      >{body}</div>,
            <div class="-footer"                    >{footer}</div>);
    }

    protected               copyData(onopen: boolean, dlgargs: IWizardDialogCallData, callargs: $JA.AjaxCallArgsType<TCall> | undefined, data: $JA.AjaxCallRequestType<TCall> | void) {
        const _dlgargs = dlgargs;
        const _callargs = callargs as any;
        const _data = data as any;
        let initdata = true;

        if (_dlgargs instanceof Object) {
            if (_callargs instanceof $JT.Record) {
                if (_dlgargs.callargs instanceof Object) {
                    _callargs.assign(_dlgargs.callargs);
                }
                if (_dlgargs.callargsext instanceof Object && _callargs instanceof $JT.Record) {
                    for (const name in _dlgargs.callargsext) {
                        if (_dlgargs.callargsext.hasOwnProperty(name)) {
                            _callargs.field(name).assign(_dlgargs.callargsext[name]);
                        }
                    }
                }
            }

            if (_data instanceof $JT.Record || _data instanceof $JT.Set) {
                if (_dlgargs.data instanceof Object) {
                    _data.assign(_dlgargs.data);
                    initdata = false;
                }
                if (_dlgargs.dataext instanceof Object && _data instanceof $JT.Record) {
                    for (const name in _dlgargs.dataext) {
                        if (_dlgargs.dataext.hasOwnProperty(name)) {
                            _data.field(name).assign(_dlgargs.dataext[name]);
                        }
                    }
                    initdata = false;
                }
            }
        }

        if (onopen && initdata) {
            if (_data instanceof $JT.Record || _data instanceof $JT.Set) {
                _data.setDefault();
            }
            this.initNewData(_data as $JA.AjaxCallRequestType<TCall>);
        }
    }

    protected               initNewData(data: $JA.AjaxCallRequestType<TCall>) {
    }

    protected abstract      formTitle(): string;
    protected abstract      formBody(callargs:$JA.AjaxCallArgsType<TCall>, data:$JA.AjaxCallRequestType<TCall>): $JD.AddNode;
    protected               formFooter()
    {
        let btns =  <div class="-buttons"/>;

        this.nextButton.show(false);
        this.prevButton.show(false);
        this.saveButton.show(false);

        btns.appendChild(<button class={$JCONTENT.std_button_cancel.class} onclick={() => this.cmdCancel()}>{$JCONTENT.std_button_cancel.text}</button>);
        btns.appendChild(this.prevButton, this.nextButton, this.saveButton);

        return btns;
    }

     protected               validate(): $JT.ValidateError[]|null {
        let errList: $JT.ValidateError[] = [];
        const data = this.data as any;

        if (data instanceof $JT.BaseType && !data.validate(errList)) {
            return errList;
        }

        return null;
    }

    protected               cmdCancel()
    {
        this.closeForm(new $JA.OperationCanceledError("Cancelled by user."));
    }

    protected               cmdSave()
    {
        this.execute((context) => this.onSave(context))
            .then((r) => this.closeForm(r));
    }

    protected               switch(next: boolean) {
        let current = this.getCurrentStep();
        let currentIndex = this.steps.indexOf(current[0], undefined);
        let nextIndex = next ? currentIndex + 1 : currentIndex - 1;

        // set next step active
        if (nextIndex !== this.steps.length) {
            this.steps[nextIndex].setActive();
            this.steps[nextIndex].container.show(true);
            this.steps[currentIndex].setInactive();
            this.steps[currentIndex].container.show(false);

            this.center();
        }

        if (nextIndex === this.steps.length - 1 ) {
            this.saveButton.show(true);
        } else {
            this.saveButton.show(false);
        }

        if (nextIndex < this.steps.length - 1 ) {
            this.nextButton.show(true);
        } else {
            this.nextButton.show(false);
        }

        if (nextIndex > 0) {
            this.prevButton.show(true);
        } else {
            this.prevButton.show(false);
        }

        this.nextButton.element.blur();
        this.prevButton.element.blur();
    }

    protected               getCurrentStep(): Step[] {
        return this.steps.filter(s => s.active );
    }

    protected               center() {
        if (this.loader) {
            this.loader._centerDialog();
        }
    }

    protected               onSave(context:$JA.Context): $JA.Task<TRtn|string|null>
    {
        const errList = this.validate();

        if (!errList) {
            let opts = {
                            callargs: this.callargs,
                            data:     this.data
                       } as $JA.IAjaxArgs;

            opts.method = 'POST';

            return $JA.Ajax(this.interfaceSave, opts, context)
                      .then((r) => this.onSaved(r));
        } else {
            const firstControl = errList.length > 0 && errList[0].control;
            if (firstControl) {
                firstControl.focus();
                throw new $JA.OperationCanceledError("Validation failed.");
            }
            else {
                return $JCONTENT.DialogError.show(errList, context)
                                .then<TRtn|string>(() => { throw new $JA.OperationCanceledError("Validation failed."); });
            }
        }
    }
    protected               onSaved(r:$JA.AjaxCallResponseType<TCall>): TRtn|string|null
    {
        return "OK";
    }

    public                  body_onkeydown(ev: KeyboardEvent) {
        if (ev.key === 'Escape' && !ev.altKey && !ev.ctrlKey && !ev.shiftKey && !ev.metaKey) {
            ev.stopPropagation();
            this.cmdCancel();
        }
        if (ev.key === 'Enter' && !ev.altKey && !ev.ctrlKey && ev.shiftKey && !ev.metaKey) {
            ev.stopPropagation();
            this.cmdSave();
        }
    }
}

export class Step extends $JD.Container {

    private _active: boolean;

    public constructor(attr: {}, ...children: $JD.AddNode[]) {
        const container = <div class="jannesen-ui-step">{children}</div>;
        super(container);

        this._active = false;

        container.show(false);
    }

    public get active() {
        return this._active;
    }

    public setActive() {
        this._active = true;
        this.container.show(true);
    }

    public setInactive() {
        this._active = false;
        this.container.show(false);
    }
}