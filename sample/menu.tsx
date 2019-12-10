/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JA      from "jc3/jannesen.async";
import * as $JD      from "jc3/jannesen.dom";
import * as $JUM     from "jc3/jannesen.ui.menu";

export function main()
{
    $JD.ondomready(()  => {
        $JD.body.appendChild(<div style="width:1000px;height:600px" ondblclick={ floatingMenu }>
                <div style="text-align: left;position:absolute;top:0px;left:400px">
                    <$JUM.MenuButton class="jannesen-ui-menu -button -more-menu" menupos={$JUM.MenuPosition.Right} onclick={ someCallback }>
                        <$JUM.MenuEntry content="Peugeot"   onclick={ someCallback } />
                        <$JUM.MenuEntry content="Toyota"    dataSource={ dataSourceToyota }/>
                        <$JUM.MenuSeperator />
                        <$JUM.MenuEntry content="Volkswagen" >
                            <$JUM.MenuEntry content="Up"   dataSource={ dataSourceYear } />
                            <$JUM.MenuEntry content="Polo" onclick={someCallback }     />
                            <$JUM.MenuEntry content="Golf" dataSource={ dataSourceYear } />
                        </$JUM.MenuEntry>
                        <$JUM.MenuEntry content="Porsche"    onclick={ someCallback } />
                        <$JUM.MenuEntry content="Volvo"      onclick={ someCallback } />
                    </$JUM.MenuButton>
                </div>
            </div>);
    });
}

const someCallback = (d:any) => console.log('callback', d);

function dataSourceToyota(ct:$JA.Context)
{
    return $JA.Task.resolve(<>
                                <$JUM.MenuEntry content="Aygo"  dataSource={ dataSourceYear }/>
                                <$JUM.MenuEntry content="Yaris" onclick={ someCallback    }/>
                                <$JUM.MenuEntry content="Auris" dataSource={ dataSourceYear }/>
                                <$JUM.MenuEntry content="Prius" dataSource={ dataSourceYear }/>
                            </>);

}

function dataSourceYear(ct:$JA.Context)
{
    return $JA.Delay(1000, ct)
              .then(() => [
                        new $JUM.MenuEntry({ content: "2015", data: "2015" }),
                        new $JUM.MenuEntry({ content: "2016", data: "2016" }),
                        new $JUM.MenuEntry({ content: "2017", data: "2017" }),
                    ]);
}

function floatingMenu(ev:MouseEvent)
{
    const m = <$JUM.FloatingMenu menupos={ $JUM.MenuPosition.Center } firstmenuclass="-transition-height">
                  <$JUM.MenuEntry content="Up"   dataSource={ dataSourceYear } />
                  <$JUM.MenuEntry content="Polo" data="Polo"     />
                  <$JUM.MenuEntry content="Golf" dataSource={ dataSourceYear } />
              </$JUM.FloatingMenu>;
    m.runAsync({left: ev.clientX, top:ev.clientY }, new $JA.Context({ timeout: 5000 }))
     .then((r) => console.log(r));
}

/*
const toyCallback = () => {
    return subMenu;
};

const vwCallback = () => {
    return subMenu2;
};

const yearCallback = () => {
    return subSubMenu;
};

const menu = [
    new $JUM.MenuItem({ name: "Audi", dataSource: toyCallback }),
    new $JUM.MenuItem({ name: "Peugeot", onclick: someCallback }),
    new $JUM.MenuItem({ name: "Porsche", onclick: someCallback }),
    new $JUM.MenuItem({ name: "Toyota", dataSource: toyCallback }),
    new $JUM.MenuItem({ name: "Volkswagen", dataSource: vwCallback }),
    new $JUM.MenuItem({ name: "Volvo", onclick: someCallback }),
];

const subMenu2: $JUM.MenuItem[] = [
];

const subMenu: $JUM.MenuItem[] = [
];


*/
