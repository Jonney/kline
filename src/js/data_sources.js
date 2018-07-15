import {NamedObject} from './named_object'
import {CToolManager} from './ctool_manager'
import * as ctools from './ctools'
import {CPoint} from './cpoint'
import Kline from './kline'

export class DataSource extends NamedObject {

    static UpdateMode = {
        DoNothing: 0,
        Refresh: 1,
        Update: 2,
        Append: 3
    };

    constructor(name) {
        super(name);
    }

    getUpdateMode() {
        return this._updateMode;
    }

    setUpdateMode(mode) {
        this._updateMode = mode;
    }

    getCacheSize() {
        return 0;
    }

    getDataCount() {
        return 0;
    }

    getDataAt(index) {
        return this._dataItems[index];
    }

}


export class MainDataSource extends DataSource {

    constructor(name) {
        super(name);
        this._erasedCount = 0;
        this._dataItems = [];
        this._decimalDigits = 0;
        this.toolManager = new CToolManager(name);
    }

    getCacheSize() {
        return this._dataItems.length;
    }

    getDataCount() {
        return this._dataItems.length;
    }

    getUpdatedCount() {
        return this._updatedCount;
    }

    getAppendedCount() {
        return this._appendedCount;
    }

    getErasedCount() {
        return this._erasedCount;
    }

    getDecimalDigits() {
        return this._decimalDigits;
    }

    calcDecimalDigits(v) {
        let str = "" + v;
        let i = str.indexOf('.');
        if (i < 0) {
            return 0;
        }
        return (str.length - 1) - i;
    }

    getLastDate() {
        let count = this.getDataCount();
        if (count < 1) {
            return -1;
        }
        return this.getDataAt(count - 1).date;
    }

    getDataAt(index) {
        return this._dataItems[index];
    }

    update(data) {
        let candles=data.candles;
        this._updatedCount = 0;
        this._appendedCount = 0;
        this._erasedCount = 0;
        let len = this._dataItems.length;
        if (len > 0) {
            let lastIndex = len - 1;
            let lastItem = this._dataItems[lastIndex];
            let e, i, cnt = candles.length;
            for (i = 0; i < cnt; i++) {
                e = candles[i];
                if (e[0] === lastItem.date) {
                    if (lastItem.open === e[1] &&
                        lastItem.high === e[2] &&
                        lastItem.low === e[3] &&
                        lastItem.close === e[4] &&
                        lastItem.volume === e[5]) {
                        this.setUpdateMode(DataSource.UpdateMode.DoNothing);
                    } else {
                        this.setUpdateMode(DataSource.UpdateMode.Update);
                        this._dataItems[lastIndex] = {
                            date: e[0],
                            open: e[1],
                            high: e[2],
                            low: e[3],
                            close: e[4],
                            volume: e[5]
                        };
                        this._updatedCount++;
                    }
                    i++;
                    if (i < cnt) {
                        this.setUpdateMode(DataSource.UpdateMode.Append);
                        for (; i < cnt; i++, this._appendedCount++) {
                            e = candles[i];
                            this._dataItems.push({
                                date: e[0],
                                open: e[1],
                                high: e[2],
                                low: e[3],
                                close: e[4],
                                volume: e[5]
                            });
                        }
                    }
                    return true;
                }
            }
            if (cnt < Kline.instance.limit) {
                this.setUpdateMode(DataSource.UpdateMode.DoNothing);
                return false;
            }
        }
        this.setUpdateMode(DataSource.UpdateMode.Refresh);
        this._dataItems = [];
        let d, n, e, i, cnt = candles.length;
        for (i = 0; i < cnt; i++) {
            e = candles[i];
            for (n = 1; n <= 4; n++) {
                d = this.calcDecimalDigits(e[n]);
                if (this._decimalDigits < d)
                    this._decimalDigits = d;
            }
            this._dataItems.push({
                date: e[0],
                open: e[1],
                high: e[2],
                low: e[3],
                close: e[4],
                volume: e[5]
            });
        }
        //渲染自定义图形
        let toolObjects=data.toolObjects;
        if(toolObjects){
            if (toolObjects.n){
                let firstDate=this.getDataAt(0).date;
                let secondDate=this.getDataAt(1).date;
                let period=secondDate-firstDate;
                let i, l = toolObjects.n.length;
                for (i = 0; i < l; i++) {
                    let pos=toolObjects.n[i];
                    let n=new ctools.NObject('frame0.k0');
                    n.setPosIV(
                        (pos[0]-firstDate)/period,pos[1],
                        (pos[2]-firstDate)/period,pos[3],
                        (pos[4]-firstDate)/period,pos[5],
                        (pos[6]-firstDate)/period,pos[7],
                    );
                    this.addToolObject(n);
                }
            }
            if (toolObjects.circles){
                let firstDate=this.getDataAt(0).date;
                let secondDate=this.getDataAt(1).date;
                let period=secondDate-firstDate;
                let i, l = toolObjects.circles.length;
                for (i = 0; i < l; i++) {
                    let pos=toolObjects.circles[i];
                    let circle=new ctools.CircleObject('frame0.k0');
                    circle.setPosIV((pos[0]-firstDate)/period,pos[1]);
                    this.addToolObject(circle);
                }
            }
        }
        return true;
    }

    select(id) {
        this.toolManager.selecedObject = id;
    }

    unselect() {
        this.toolManager.selecedObject = -1;
    }

    addToolObject(toolObject) {
        this.toolManager.addToolObject(toolObject);
    }

    delToolObject() {
        this.toolManager.delCurrentObject();
    }

    getToolObject(index) {
        return this.toolManager.getToolObject(index);
    }

    getToolObjectCount() {
        return this.toolManager.toolObjects.length;
    }

    getCurrentToolObject() {
        return this.toolManager.getCurrentObject();
    }

    getSelectToolObjcet() {
        return this.toolManager.getSelectedObject();
    }

    delSelectToolObject() {
        this.toolManager.delSelectedObject();
    }

}

