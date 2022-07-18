﻿/// <export-interface path="jannesen.timezone.ts"/>

export const Name = "CET";

export function UtcToLocal<T extends number|null|undefined>(d:T):T
{
    if (typeof d !== 'number')
        return d;

    let o=60;
    if (d<1269738000000){
        if (d<1017536400000){
            if (d<891133200000){
                if (d<828234000000){
                    if (d>=796179600000 && d<811904400000) o=120;
                }else{
                    if (d<846378000000) o=120;
                    if (d>=859683600000 && d<877827600000) o=120;
                }
            }else{
                if (d<954032400000){
                    if (d<909277200000) o=120;
                    if (d>=922582800000 && d<941331600000) o=120;
                }else{
                    if (d<972781200000) o=120;
                    if (d>=985482000000 && d<1004230800000) o=120;
                }
            }
        }else{
            if (d<1143334800000){
                if (d<1080435600000){
                    if (d<1035680400000) o=120;
                    if (d>=1048986000000 && d<1067130000000) o=120;
                }else{
                    if (d<1099184400000) o=120;
                    if (d>=1111885200000 && d<1130634000000) o=120;
                }
            }else{
                if (d<1206838800000){
                    if (d<1162083600000) o=120;
                    if (d>=1174784400000 && d<1193533200000) o=120;
                }else{
                    if (d<1224982800000) o=120;
                    if (d>=1238288400000 && d<1256432400000) o=120;
                }
            }
        }
    }else{
        if (d<1521939600000){
            if (d<1396141200000){
                if (d<1332637200000){
                    if (d<1288486800000) o=120;
                    if (d>=1301187600000 && d<1319936400000) o=120;
                }else{
                    if (d<1351386000000) o=120;
                    if (d>=1364691600000 && d<1382835600000) o=120;
                }
            }else{
                if (d<1459040400000){
                    if (d<1414285200000) o=120;
                    if (d>=1427590800000 && d<1445734800000) o=120;
                }else{
                    if (d<1477789200000) o=120;
                    if (d>=1490490000000 && d<1509238800000) o=120;
                }
            }
        }else{
            if (d<1648342800000){
                if (d<1585443600000){
                    if (d<1540688400000) o=120;
                    if (d>=1553994000000 && d<1572138000000) o=120;
                }else{
                    if (d<1603587600000) o=120;
                    if (d>=1616893200000 && d<1635642000000) o=120;
                }
            }else{
                if (d<1711846800000){
                    if (d<1667091600000) o=120;
                    if (d>=1679792400000 && d<1698541200000) o=120;
                }else{
                    if (d<1729990800000) o=120;
                    if (d>=1743296400000 && d<1761440400000) o=120;
                }
            }
        }
    }
    return d+(o*60000) as T;
}
export function LocalToUtc<T extends number|null|undefined>(d:T):T
{
    if (typeof d !== 'number')
        return d;

    let o=60;
    if (d<1269745200000){
        if (d<1017543600000){
            if (d<891140400000){
                if (d<828241200000){
                    if (d>=796186800000 && d<811911600000) o=120;
                }else{
                    if (d<846385200000) o=120;
                    if (d>=859690800000 && d<877834800000) o=120;
                }
            }else{
                if (d<954039600000){
                    if (d<909284400000) o=120;
                    if (d>=922590000000 && d<941338800000) o=120;
                }else{
                    if (d<972788400000) o=120;
                    if (d>=985489200000 && d<1004238000000) o=120;
                }
            }
        }else{
            if (d<1143342000000){
                if (d<1080442800000){
                    if (d<1035687600000) o=120;
                    if (d>=1048993200000 && d<1067137200000) o=120;
                }else{
                    if (d<1099191600000) o=120;
                    if (d>=1111892400000 && d<1130641200000) o=120;
                }
            }else{
                if (d<1206846000000){
                    if (d<1162090800000) o=120;
                    if (d>=1174791600000 && d<1193540400000) o=120;
                }else{
                    if (d<1224990000000) o=120;
                    if (d>=1238295600000 && d<1256439600000) o=120;
                }
            }
        }
    }else{
        if (d<1521946800000){
            if (d<1396148400000){
                if (d<1332644400000){
                    if (d<1288494000000) o=120;
                    if (d>=1301194800000 && d<1319943600000) o=120;
                }else{
                    if (d<1351393200000) o=120;
                    if (d>=1364698800000 && d<1382842800000) o=120;
                }
            }else{
                if (d<1459047600000){
                    if (d<1414292400000) o=120;
                    if (d>=1427598000000 && d<1445742000000) o=120;
                }else{
                    if (d<1477796400000) o=120;
                    if (d>=1490497200000 && d<1509246000000) o=120;
                }
            }
        }else{
            if (d<1648350000000){
                if (d<1585450800000){
                    if (d<1540695600000) o=120;
                    if (d>=1554001200000 && d<1572145200000) o=120;
                }else{
                    if (d<1603594800000) o=120;
                    if (d>=1616900400000 && d<1635649200000) o=120;
                }
            }else{
                if (d<1711854000000){
                    if (d<1667098800000) o=120;
                    if (d>=1679799600000 && d<1698548400000) o=120;
                }else{
                    if (d<1729998000000) o=120;
                    if (d>=1743303600000 && d<1761447600000) o=120;
                }
            }
        }
    }

    return d-(o*60000) as T;
}
