import { Component,_ } from '../Component';
import { Vector3 } from 'mmgl/src/index';

// this.tickLine = {//刻度线
//     enabled: 1,
//     lineWidth: 1, //线宽
//     lineLength: 4, //线长
//     strokeStyle: '#cccccc',
//     // distance: 2,
//     offset: 2,
// };


class TickLines extends Component {
    constructor(_coordSystem, opts) {
        super(_coordSystem);

        //点的起点位置集合
        this.origins = [];

        //刻度线的绘制方向
        this.dir = new Vector3();

        //刻度线的宽带
        this.lineWidth = opts.lineWidth;

        //刻度线的长度
        //todo 轴线的长度是个数组 通过像素值转换
        this.length = opts.lineLength;

        this.color = opts.strokeStyle;

        this.offset = opts.offset;

        this._tickLine = null;

        this.group.visible = !!opts.enabled;
    }
    initData(axis, attribute, fn) {
        let me = this;
        let _dir = new Vector3();
        let _offset = _dir.copy(me.dir).multiplyScalar(this._offset);
        this.origins = [];
        attribute.getSection().forEach((num, index) => {
            //起点
            let val = fn.call(this._coordSystem, num,attribute)
            let startPoint = axis.dir.clone().multiplyScalar(val);
            startPoint.add(axis.origin);
            startPoint.add(_offset);
            me.origins.push(startPoint);

        });
    }
    set length(len) {

        this._length = len;
    }
    get length() {
        return this._length;
    }

    set offset(_offset) {
        this._offset = _offset;
    }

    get offset() {
        return this._offset;
    }

    setDir(dir) {
        this.dir = dir;
    }
    drawStart() {
        this._tickLine = this._root.app.createLine(this.origins, this.dir, this._length, this.lineWidth, this.color);
    }
    update() {
        let origins = this.origins;
        let triangleVertices = [];
        let endPoint = null;
        let direction = this.dir.clone();
        let length = this._length;


        let i = 0;
        this._tickLine.traverse(obj => {
            if (obj.isLine2) {
                triangleVertices = [];
                triangleVertices.push([0, 0, 0]);

                endPoint = new Vector3();
                endPoint.copy(direction);
                endPoint.multiplyScalar(length);

                triangleVertices.push(endPoint.toArray());

                obj.geometry.setPositions(_.flatten(triangleVertices));
                obj.position.copy(origins[i]);
                i++;
            }
        })


    }

    draw() {
        this.group.add(this._tickLine);
    }



    // getBoundBox() {
    //     let result = new Box3();
    //     result.makeEmpty();
    //     this._tickLine.traverse(function (mesh) {
    //         if (mesh instanceof Mesh) {
    //             mesh.geometry.computeBoundingBox();
    //             result.expandByPoint(mesh.geometry.boundingBox.min);
    //             result.expandByPoint(mesh.geometry.boundingBox.max);
    //         }
    //     });

    //     return result;
    // }
    dispose() {
        let remove = [];
        this.group.traverse((obj) => {
            if (obj.isLine2) {
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
                if (obj.material) {
                    obj.material.dispose();
                }
                remove.push(obj);

            }
        });
        while (remove.length) {
            let obj = remove.pop();
            obj.parent.remove(obj);
        }

    }
}

export { TickLines };