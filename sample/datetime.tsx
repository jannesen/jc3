/// <amd-dependency path="jc3/jannesen.inputex" />
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J    from "jc3/jannesen";
import * as $JD   from "jc3/jannesen.dom";
import * as $JTE  from "jc3/jannesen.datatypeex";

export function main()
{
    $JD.ondomready(() => {
        const daterange = $JTE.DateRange.subClass({ maxValue: $J.curDate() });
        const dr = new daterange();

        $JD.body.appendChild(<div> {dr.getControl()} </div>);
        $JD.body.appendChild(<div> <button onclick={() => { dr.validateNow({}); }}>Validate</button></div>);

        dr.control.bind('blur', () => {
                console.log('blur');
            });
    });
}
