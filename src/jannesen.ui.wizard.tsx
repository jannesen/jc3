﻿/// <reference path="lib-ext.d.ts"/>
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */

import * as $J          from "jc3/jannesen";
import * as $JT         from "jc3/jannesen.datatype";
import * as $JA         from "jc3/jannesen.async";
import * as $JD         from "jc3/jannesen.dom";
import * as $JTEMPLATE  from "jc3/jannesen.ui.template";
import * as $JCONTENT   from "jc3/jannesen.ui.content";
import * as $JR         from "jc3/jannesen.language";

export interface IWizardDialogCallData
{
    callargs?:              $JT.Record<$JT.IFieldDef> | $JT.IRecord | $J.IUrlArgs ;
    callargsext?:           $JT.IRecord;
    data?:                  $JT.Record<$JT.IFieldDef> | $JT.IRecord | $JT.RecordSet<$JT.IFieldDef>;
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
    protected               stepCounter:        $JD.DOMHTMLElement;

    public static           hasPermission():    boolean
    {
        return $JTEMPLATE.hasPermission(Object.getOwnPropertyDescriptor(this.prototype, "interfaceSave")!.get!.call(undefined));
    }
    protected get           interfaceSave():    TCall
    {
        throw new $J.InvalidStateError("interfaceSave not implemented.");
    }

    protected get           totalSteps() {
        return this.steps.length;
    }

    protected get           currentStep() {
        const current = this.getCurrentStep();
        const currentIndex = this.steps.indexOf(current[0], undefined);
        return currentIndex + 1;
    }

    public constructor(context:$JA.Context) {
        super(context);

        this.saveButton = <button class={$JCONTENT.std_button_save.class} onclick={() => this.cmdSave()}>{$JCONTENT.std_button_save.text}</button>;
        this.prevButton = <button class={$JCONTENT.std_button_prev.class} onclick={() => this.switch(false)}>{$JCONTENT.std_button_prev.text}</button>;
        this.nextButton = <button class={$JCONTENT.std_button_next.class} onclick={() => this.switch(true)}>{$JCONTENT.std_button_next.text}</button>;
        this.stepCounter = <span class="wizard-steps"></span>;

        const interfaceSave = this.interfaceSave;
        this.callargs = (interfaceSave.callargs_type) ? (new interfaceSave.callargs_type()) : undefined;
        this.data = (interfaceSave.request_type) ? (new interfaceSave.request_type()) as any : undefined;
    }

    public                  recalculateSteps() {
        this.stepCounter.text($JR.wizard_steps(this.currentStep, this.totalSteps.toString()));
    }

    protected               onload() {
    }

    protected               onopen(args: TArgs, ct: $JA.Context) {
        return $JA.Task.from(this.copyData(true, this.args, this.callargs, this.data, ct))
                       .thenD(() => {
                           const title = this.formTitle();
                           const body = this.formBody(this.callargs, this.data);
                           const footer = this.formFooter();

                           const first = this.steps[0];
                           first.container.show(true);
                           first.setActive();

                           this.nextButton.show(true);

                           this.content.addClass("jannesen-ui-template-wizard-dialog");
                           this.content.appendChild(<div class="-header -dialog-move-target"><span class="-title">{title}</span>{this.stepCounter}</div>,
                                                    <div class="-body"                      >{body}</div>,
                                                    <div class="-footer"                    >{footer}</div>);
                       });
    }

    protected               copyData(onopen: boolean, dlgargs: IWizardDialogCallData, callargs: $JA.AjaxCallArgsType<TCall> | undefined, data: $JA.AjaxCallRequestType<TCall> | void, ct:$JA.Context): void|$JA.Task<void> {
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
        const btns =  <div class="-buttons"/>;

        this.nextButton.show(false);
        this.prevButton.show(false);
        this.saveButton.show(false);

        btns.appendChild(<button class={$JCONTENT.std_button_cancel.class} onclick={() => this.cmdCancel()}>{$JCONTENT.std_button_cancel.text}</button>);
        btns.appendChild(this.prevButton, this.nextButton, this.saveButton);

        return btns;
    }

    protected               validate(ct:$JA.Context): $JA.Task<$JT.ValidateResult>
    {
        return this.data as unknown instanceof $JT.BaseType ? (this.data as unknown as $JT.BaseType).validateAsync({ context:ct }) : $JA.Task.resolve($JT.ValidateResult.OK);
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
        const current = this.getCurrentStep();
        const currentIndex = this.steps.indexOf(current[0], undefined);
        const nextIndex = next ? currentIndex + 1 : currentIndex - 1;

        // set next/previous step active if there are any
        if (nextIndex !== this.steps.length) {
            this.steps[nextIndex].setActive();
            this.steps[nextIndex].container.show(true);
            this.steps[currentIndex].setInactive();
            this.steps[currentIndex].container.show(false);

            if (nextIndex === this.steps.length - 1) {
                this.saveButton.show(true);
            } else {
                this.saveButton.show(false);
            }

            if (nextIndex < this.steps.length - 1) {
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

            //refresh display text with new values
            this.stepCounter.text($JR.wizard_steps(this.currentStep, this.totalSteps.toString()));
        }
    }

    protected               getCurrentStep(): Step[] {
        return this.steps.filter(s => s.active );
    }

    protected               center() {
        if (this.loader) {
            this.loader._positionDialog();
        }
    }

    protected               onSave(context:$JA.Context): $JA.Task<TRtn|string|null>
    {
        return this.validate(context)
                   .then(() => {
                             const opts = {
                                             callargs: this.callargs,
                                             data:     this.data
                                          } as $JA.IAjaxArgs;

                             return $JA.Ajax(this.interfaceSave, opts, context)
                                       .then((r) => this.onSaved(r));
                         });
    }

    protected               onSaved(r:$JA.AjaxCallResponseType<TCall>): TRtn|string|null
    {
        return "OK";
    }

    public                  body_onkeydown(ev: KeyboardEvent) {
        if (ev.key === 'Escape' && !ev.altKey && !ev.ctrlKey && !ev.shiftKey && !ev.metaKey) {
            this.cmdCancel();
            $J.eventHandled(ev);
            return;
        }
        if (ev.key === 'Enter' && !ev.altKey && !ev.ctrlKey && ev.shiftKey && !ev.metaKey) {
            this.cmdSave();
            $J.eventHandled(ev);
            return;
        }
    }
}

export interface IStepAttr {
    width?: string;
    height?: string;
}

export class Step extends $JD.Container {

    private _active: boolean;

    public constructor(attr: IStepAttr, ...children: $JD.AddNode[]) {
        const container = <div class="jannesen-ui-step" style="width:100%;height:100%;">{children}</div>;
        if (attr) {
            container.css("width", attr.width);
            container.css("height", attr.height);
        }

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
