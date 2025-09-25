/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $J         from "jc3/jannesen";
import * as $JD        from "jc3/jannesen.dom";
import * as $JA        from "jc3/jannesen.async";
import * as $JCONTENT  from "jc3/jannesen.ui.content";
import * as $JMAIN     from "jc3/jannesen.ui.main";
import * as $JTREEVIEW from "jc3/jannesen.ui.treeview";
import * as $JMENU     from "jc3/jannesen.ui.menu";

interface IItem
{
    text:       string;
    treelist?:  string;
    url?:       string;
    children?:  IItem[];
}

export function main()
{
    $JD.ondomready(() => {
        $JD.body.css("overflow", "hidden");

        const main = <$JMAIN.Main size={$JD.window.size}
                                  sidebarWidth={300}
                                  sidebarPinned={true}
                                  sidebarVisible={true}
                                  sidebarDataSource={(item, ct) => {
                                                                        if (!item || item.data.treelist) {
                                                                            const url = item ? item.data.treelist : 'api-root.json';
                                                                            return $JA.Ajax<$JA.IAjaxCallDefinition<void, void, IItem[]>>(undefined, { url: 'data/' + url }, ct)
                                                                                      .then(items => items.map(item => item.url ? new $JTREEVIEW.TreeViewItemEndPoint(item.text, item) : new $JTREEVIEW.TreeViewItemList(item.text, item)));
                                                                        } else if (item.data.children) {
                                                                            return item.data.children.map((item:IItem) => item.url ? new $JTREEVIEW.TreeViewItemEndPoint(item.text, item) : new $JTREEVIEW.TreeViewItemList(item.text, item));
                                                                        } else {
                                                                            console.log('case not supported yet');
                                                                        }
                                                                    }}
                                  onsidebarclick={(item) => { $JD.setLocationHash("#!"+item.data.url); }}
                      />;

        $JD.body.appendChild(main);

        document.addEventListener("scroll", () => { document.documentElement.scrollTop=0; }); // Work arond a bug in chrome where some time the scroll height > client height.

        $JD.window.bind("resize", () => { main.size = $JD.window.size; }, undefined);

        $JD.onlocationhashchange(openHashbang);
        openHashbang(location.hash);

        function openHashbang(hashbang:string)
        {
            try {
                if (hashbang && hashbang.startsWith("#!")) {
                    const parts = /^#!([a-zA-Z0-9_\-\.]+(?::[a-zA-Z0-9_]+))?(?:\?(.*))?$/.exec(hashbang);

                    if (parts && typeof parts[1] === 'string') {
                        main.openform(parts[1]!, $J.parseUrlArgs(parts.length > 2 && typeof parts[2] === 'string' ? parts[2]! : ""), true, $JMAIN.get_browser_formstate(false));
                    } else {
                        main.openform(IFrame, hashbang.substr(2), true);
                    }
                } else {
                    main.openform(Blank, undefined);
                }
            }
            catch(err) {
                main.openform<Error>($JCONTENT.FormError, err);
            }
        }
    });
}

export class Blank extends $JCONTENT.Form
{
    protected       onopen(err:Error, state:void, ct:$JA.Context)
    {
    }
}

export class IFrame extends $JCONTENT.Form<string>
{
    private         _iframe!:       $JD.DOMHTMLElement;
    private         _src!:          string;

    public          formTitle()
    {
        return this._src;
    }

    protected       onload(ct:$JA.Context)
    {
        this.content.css({ "width":"100%", "height":"100%"});
        this.content.appendChild(this._iframe = <iframe style="width:100%; height:100%; overflow:hidden; border:0 none" />);
    }

    protected       onopen(src:string, state:void, ct:$JA.Context)
    {
        this._iframe.attr("src", this._src = src);
    }
}

export class Welkom extends $JCONTENT.Form
{
    protected       onopen(err:Error, state:void, ct:$JA.Context)
    {
        this.content.appendChild(<h1>Welkom</h1>);
        return $JA.Delay(1000, ct);
    }

    public          formTitle()
    {
        return "Welkom";
    }
    public          moreMenuEnabled()
    {
        return true;
    }
    public          moreMenuDatasource(ct:$JA.Context):$JMENU.DataSourceResult
    {
        return [
                    <$JMENU.MenuEntry content="item 1" onclick={() => this.execute((context) => $JCONTENT.DialogMessage.show({
                                                                                                                                title:   "Test",
                                                                                                                                message: "Test item 1"
                                                                                                                             }, context))
                                                               }/>,
                    <$JMENU.MenuEntry content="item 2" />,
                    <$JMENU.MenuEntry content="item 3" />
               ];
    }
}
