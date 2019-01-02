/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JA from "jc3/jannesen.async";
import * as $JD from "jc3/jannesen.dom";
import * as $JC from "jc3/jannesen.ui.content";

export function main()
{
    $JD.ondomready(() => {
        $JD.body.css("overflow", "hidden").css("display", "flex");
        const ac = [ createTest(), createTest() ];

        resize();
        resize();
        $JD.window.bind("resize", resize, undefined);

        function resize() {
            const ws = $JD.window.size;
            ac.forEach((e) => {
                            e.setSize({
                                        height: ws.height - e.container.offset.top,
                                        width:  ws.width / ac.length
                                      });
                       });
        }
    });
}

function createTest()
{
    let   ac:$JC.FormLoader<any>;
    $JD.body.appendChild(<div style="display:inline-block;width:50%">
                            <div >
                                <button onclick={() => { ac.open("content", undefined, undefined, undefined); }}>load</button>
                                <button onclick={() => {
                                    ac.execute((context) =>  Dialog.show(context)
                                                                   .then((a) => $JC.DialogMessage.show({
                                                                                                            title: "Result",
                                                                                                            message: "result: " + a
                                                                                                       }, context)));
                                }}>execute</button>
                            </div>
                            { ac = new $JC.FormLoader() }
                        </div>);
    return ac;
}

export class FormModule extends $JC.Form<any>
{
    protected       onload(ct:$JA.ICancellationToken):$JA.Task<void>|void
    {
        this.content.appendChild(<div>init</div>);
        return $JA.Delay(500, ct);
    }
    protected       onopen(args:any, state:void, ct:$JA.ICancellationToken):$JA.Task<void>|void
    {
        this.content.appendChild(<div>open</div>,
                                 <div>
                                    <input type="text"/>
                                 </div>);
        return $JA.Delay(1000, ct).then(() => { this._content.appendChild(<div>done</div>); });
    }
}

export class Dialog extends $JC.Dialog<void, string>
{
    public static       show(context:$JA.ICancellationToken|$JC.AsyncContext): $JA.Task<string|undefined>
    {
        return $JC.dialogShow(Dialog, undefined, context);
    }

    protected           onload(ct:$JA.ICancellationToken)
    {
        return $JA.Delay(1000, ct);
    }
    public              formTitle(): string
    {
        return "Dialog test";
    }
    public              formBody()
    {
        return <>
                    <div>test</div>
                    <input type="text" />
                    <button onclick={() => this.execute((context) => Dialog.show(context))}>new dialog</button>
               </>;
    }
    public              formFooterButtons()
    {
        return [ $JC.std_button_cancel_error, $JC.std_button_ok ];
    }

}
