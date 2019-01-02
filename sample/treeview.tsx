/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";
import * as $JUT     from "jc3/jannesen.ui.treeview";

interface IItem
{
    text:       string;
    treelist?:  string;
    url?:       string;
    children?:  IItem[];
}

export function main()
{
    $JD.ondomready(()  => {
        const treeview = <$JUT.TreeView dataSource={(item, cancelationToken) => {
                                                        if (!item || item.data.treelist) {
                                                            let url = item ? item.data.treelist : 'api-root.json';
                                                            return $JA.Ajax<$JA.IAjaxCallDefinition<void, void, IItem[]>>(undefined, { url: 'data/' + url }, cancelationToken)
                                                                      .then(items => items.map((i) => i.url ? new $JUT.TreeViewItemEndPoint(i.text, item) : new $JUT.TreeViewItemList(i.text, item)));
                                                        } else if (item.data.children) {
                                                            return item.data.children.map((i:IItem) => i.url ? new $JUT.TreeViewItemEndPoint(i.text, item) : new $JUT.TreeViewItemList(i.text, item));
                                                        } else {
                                                            console.log('case not supported yet');
                                                        }
                                                    }}
                                        onclick={(item) => alert('opening: ' + item.data.url)}
                            />;
        $JD.body.appendChild(<div>{treeview}</div>);
        treeview.focus();
    });
}
