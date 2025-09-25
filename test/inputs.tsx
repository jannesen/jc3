/// <amd-dependency path="jc3/jannesen.input" />
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
//import * as $J       from "jc3/jannesen";
//import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";
import * as $JT      from "jc3/jannesen.datatype";

export function main()
{
    $JD.ondomready(appl);
}

function appl()
{
    $JD.body.appendChild(<table>
                            <colgroup>
                                <col />
                                <col style="width:20em"/>
                            </colgroup>
                            <tr>
                                <td>String</td>
                                <td>{ new ($JT.String.subClass({ maxLength: 64 }))().getControl() }</td>
                            </tr>
                            <tr>
                                <td>Integer</td>
                                <td>{ new ($JT.Integer.subClass({ minValue:0, maxValue:1000 }))().getControl() }</td>
                            </tr>
                            <tr>
                                <td>Number</td>
                                <td>{ new ($JT.Number.subClass({}))() .getControl() }</td>
                            </tr>
                            <tr>
                                <td>Boolean</td>
                                <td>{ new ($JT.Boolean.subClass({}))() .getControl() }</td>
                            </tr>
                            <tr>
                                <td>Date</td>
                                <td>{ new ($JT.Date.subClass({}))() .getControl() }</td>
                            </tr>
                            <tr>
                                <td>Time</td>
                                <td>{ new ($JT.Time.subClass({}))() .getControl() }</td>
                            </tr>
                            <tr>
                                <td>DateTime</td>
                                <td>{ new ($JT.DateTime.subClass({}))() .getControl() }</td>
                            </tr>
                            <tr>
                                <td>String with dropdown_values</td>
                                <td>{ new ($JT.String.subClass({ maxLength: 64 }))().getControl({ dropdown_values: ()=> [ 'A','B','C'] } ) }</td>
                            </tr>
                            <tr>
                                <td>Integer with dropdown_values</td>
                                <td>{ new ($JT.Integer.subClass({}))().getControl({ dropdown_values: ()=> [ 1,2,3 ] }) }</td>
                            </tr>
                         </table>);
}
