/* @jsx-mode generic */
/* @jsx-intrinsic-factory $JD.createElement */
import * as $JD      from "jc3/jannesen.dom";
import * as $JUM     from "jc3/jannesen.ui.menu";

export function main()
{
    $JD.ondomready(()  => {
        $JD.body.appendChild(<div style="width:2000px;height:2000px">
                <div style="text-align: left;position:absolute;top:100px;left:400px">
                    <$JUM.MenuButton btnclass="-more-menu" menupos={$JUM.MenuPosition.Right}>
                        <$JUM.MenuEntry content="Peugeot"    onclick={ someCallback } />
                        <$JUM.MenuEntry content="Toyota"    >
                            <$JUM.MenuEntry content="Aygo"  dataSource={ ()=>yearMenu }/>
                            <$JUM.MenuEntry content="Yaris" onclick={ someCallback    }/>
                            <$JUM.MenuEntry content="Auris" dataSource={ ()=>yearMenu }/>
                            <$JUM.MenuEntry content="Prius" dataSource={ ()=>yearMenu }/>
                        </$JUM.MenuEntry>
                        <$JUM.MenuSeperator />
                        <$JUM.MenuEntry content="Volkswagen" >
                            <$JUM.MenuEntry content="Up"   dataSource={ ()=>yearMenu } />
                            <$JUM.MenuEntry content="Polo" onclick={someCallback }     />
                            <$JUM.MenuEntry content="Golf" dataSource={ ()=>yearMenu } />
                        </$JUM.MenuEntry>
                        <$JUM.MenuEntry content="Porsche"    onclick={ someCallback } />
                        <$JUM.MenuEntry content="Volvo"      onclick={ someCallback } />
                    </$JUM.MenuButton>
                </div>
            </div>);
    });
}

const someCallback = () => console.log('callback registered');

const yearMenu: $JUM.MenuEntry[] = [
    new $JUM.MenuEntry({ content: "2015", onclick: someCallback }),
    new $JUM.MenuEntry({ content: "2016", onclick: someCallback }),
    new $JUM.MenuEntry({ content: "2017", onclick: someCallback }),
];

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
