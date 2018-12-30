/// <amd-dependency path="jc3/jannesen.inputex" />
/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JD from "jc3/jannesen.dom";
import * as $JTAB from "jc3/jannesen.ui.tab";

export function main() {
    $JD.ondomready(() => {
        $JD.body.appendChild(
            <$JTAB.Tabs>
                <$JTAB.Tab title="Test1">
                    <p>dit is een test 1</p>
                </$JTAB.Tab>
                <$JTAB.Tab title="Test2">
                    <p>dit is een test2</p>
                </$JTAB.Tab>
                <$JTAB.Tab title="Logs" onclick={() => alert('click:logs') } loadcontent={() => logContent() } />
            </$JTAB.Tabs>);
    });

    function logContent() {
        return <p>Logs</p>;
    }
}
