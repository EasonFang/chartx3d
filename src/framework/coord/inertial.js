
import { Events, Vector3, Box3, Matrix4, Vector2, Math as _Math, AmbientLight, DirectionalLight, PointLight, } from "mmgl/src/index";
import { _ } from 'mmvis';


//默认坐标系的中心点与坐标系的原点都为世界坐标的[0,0,0]点
//惯性坐标系
class InertialSystem extends Events {
    constructor(root) {
        super();

        this._root = root;
        this.coord = {};

        //坐标原点
        this.origin = new Vector3(0, 0, 0);
        //中心的
        this.center = new Vector3(0, 0, 0);

        this.boundbox = new Box3();
        this.size = new Vector3();
        this.baseBoundbox = new Box3();
        this.padding = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            front: 0,
            back: 0
        }

        this.width = root.width;
        this.height = root.height;


        this.fieldMap = [];
        this.group = root.app.addGroup({ name: 'InertialSystem' });
        _.extend(true, this, this.setDefaultOpts(root.opt));

    }

    setDefaultOpts(opts) {
        return opts;
    }
    init() {

    }
    addLights() {
        //加入灯光

        var ambientlight = new AmbientLight(0xffffff, 0.8); // soft white light

        this._root.rootStage.add(ambientlight);

        let center = this.center.clone();
        center = this._getWorldPos(center);
        //center.setY(0);

        //     let dirLights = [];
        let intensity = 0.5;
        let lightColor = 0xcccccc;
        //     let position = new Vector3(-1, -1, 1);

        //     dirLights[0] = new DirectionalLight(lightColor, intensity);
        //     position.multiplyScalar(10000);
        //     dirLights[0].position.copy(position);
        //     dirLights[0].target.position.copy(center);
        //    // this._root.rootStage.add(dirLights[0]);


        //     dirLights[1] = new DirectionalLight(lightColor, intensity);
        //     position = new Vector3(1, -1, 1);
        //     position.multiplyScalar(10000);
        //     dirLights[1].position.copy(position);
        //     dirLights[1].target.position.copy(center);
        //     this._root.rootStage.add(dirLights[1]);


        //     dirLights[2] = new DirectionalLight(lightColor, intensity);
        //     position = new Vector3(-1, -1, -1);
        //     position.multiplyScalar(10000);
        //     dirLights[2].position.copy(position);
        //     dirLights[2].target.position.copy(center);
        //     this._root.rootStage.add(dirLights[2]);


        //     dirLights[3] = new DirectionalLight(lightColor, intensity);
        //     position = new Vector3(1, -1, -1);
        //     position.multiplyScalar(10000);
        //     dirLights[3].position.copy(position);
        //     dirLights[3].target.position.copy(center);
        //     this._root.rootStage.add(dirLights[3]);




        let pointLight = [];

        pointLight[0] = new PointLight(lightColor, intensity);
        let position = new Vector3(-1, 1, 1);
        position.multiplyScalar(10000);
        pointLight[0].position.copy(position);
        this._root.rootStage.add(pointLight[0]);


        pointLight[1] = new PointLight(lightColor, intensity);
        position = new Vector3(1, 1, 1);
        position.multiplyScalar(10000);
        pointLight[1].position.copy(position);
        this._root.rootStage.add(pointLight[1]);


        pointLight[2] = new PointLight(lightColor, intensity);
        position = new Vector3(-1, 1, -1);
        position.multiplyScalar(10000);
        pointLight[2].position.copy(position);
        this._root.rootStage.add(pointLight[2]);


        pointLight[3] = new PointLight(lightColor, intensity);
        position = new Vector3(1, 1, -1);
        position.multiplyScalar(1000);
        pointLight[3].position.copy(position);
        this._root.rootStage.add(pointLight[3]);

    }
    updatePosition(center) {

        //更新相机姿态
        center = center || this.center.clone();
        center = this._getWorldPos(center);
        let _renderView = this._root.renderView;
        let _camera = _renderView._camera;

        //相机默认的旋转角度
        let dist = _camera.position.distanceTo(center);
        let phi = _Math.degToRad(_renderView.controls.alpha);   //(90-lat)*(Math.PI/180),
        let theta = _Math.degToRad(_renderView.controls.beta);   // (lng+180)*(Math.PI/180),

        let y = dist * Math.sin(phi);
        let temp = dist * Math.cos(phi);
        let x = temp * Math.sin(theta);
        let z = temp * Math.cos(theta);
        //平移实现以中心点为圆心的旋转结果
        let newPos = new Vector3(x, y, z);
        newPos.add(center);
        _camera.position.copy(newPos);
        //相机朝向中心点 
        _camera.lookAt(center);


        //orbite target position
        this._root.orbitControls.target.copy(center);

    }

    getEnabledFields(fields) {
        if (fields) {
            //如果有传参数 fields 进来，那么就把这个指定的 fields 过滤掉 enabled==false的field
            //只留下enabled的field 结构
            return this.filterEnabledFields(fields);
        };

        // var fmap = {
        //     left: [], right:[]
        // };

        // _.each( this.fieldsMap, function( bamboo, b ){
        //     if( _.isArray( bamboo ) ){
        //         //多节竹子，堆叠

        //         var align;
        //         var fields = [];

        //         //设置完fields后，返回这个group属于left还是right的axis
        //         _.each( bamboo, function( obj, v ){
        //             if( obj.field && obj.enabled ){
        //                 align = obj.yAxis.align;
        //                 fields.push( obj.field );
        //             }
        //         } );

        //         fields.length && fmap[ align ].push( fields );

        //     } else {
        //         //单节棍
        //         if( bamboo.field && bamboo.enabled ){
        //             fmap[ bamboo.yAxis.align ].push( bamboo.field );
        //         }
        //     };
        // } );

        // return fmap;
    }

    filterEnabledFields(fields) {
        var me = this;
        var arr = [];

        if (!_.isArray(fields)) fields = [fields];
        _.each(fields, function (f) {
            if (!_.isArray(f)) {
                if (me.getFieldMap(f).enabled) {
                    arr.push(f);
                }
            } else {
                //如果这个是个纵向数据，说明就是堆叠配置
                var varr = [];
                _.each(f, function (v_f) {
                    if (me.getFieldMap(v_f).enabled) {
                        varr.push(v_f);
                    }
                });
                if (varr.length) {
                    arr.push(varr)
                }
            }
        });
        return arr;
    }

    getFieldMap(field) {
        let searchOpt = null;
        let fieldMap = null;
        let get = (maps) => {
            if (maps) {
                let zField = this.isExistZAxisField && this.isExistZAxisField();
                if (zField) {
                    searchOpt = {
                        key: zField,
                        value: field
                    };
                } else {
                    searchOpt = {
                        key: 'field',
                        value: field
                    }
                }

                _.each(maps, function (map, i) {
                    if (_.isArray(map)) {
                        get(map)
                    } else if (map[searchOpt.key] == searchOpt.value) {
                        fieldMap = map;
                        return false;
                    }
                });
            }

        }
        get(this.fieldsMap);
        return fieldMap;

    }
    getColor(field) {
        return this.getFieldMap(field) && this.getFieldMap(field).color;
    }

    getLegendData() {
        var me = this;
        var data = [];
        _.each(_.flatten(me.fieldsMap), function (map, i) {
            //因为yAxis上面是可以单独自己配置field的，所以，这部分要过滤出 legend data
            var isGraphsField = false;
            _.each(me.graphs, function (gopt) {
                if (_.indexOf(_.flatten([gopt.field]), map.field) > -1) {
                    isGraphsField = true;
                    return false;
                }
            });

            if (isGraphsField) {
                data.push({
                    enabled: map.enabled,
                    name: map.field,
                    field: map.field,
                    ind: map.ind,
                    color: map.color,
                    yAxis: map.yAxis
                });
            }
        });
        return data;
    }
    getBoundbox() {

        let _boundbox = new Box3();

        let _opt = this._root.opt.coord.controls;
        //let _frustumSize = this._root.renderView.mode == 'ortho' ? _opt.boxHeight * 0.8 : _opt.boxHeight;
        let _height = _opt.boxHeight;
        let _width = _opt.boxWidth;
        let _depth = _opt.boxDepth;
        
        //斜边
        let _hypotenuse = _opt.distance || (new Vector3(_width, 0, _depth)).length();

        let _ratio = this._root.renderView.getVisableSize(new Vector3(0, 0, -_hypotenuse)).ratio;

        let minX = - _width * 0.5 + this.padding.left * _ratio;
        // let minY = - _frustumSize * 0.5 + this.padding.bottom * _ratio;
        let minY = - _height * 0.5 + this.padding.bottom * _ratio;
        let minZ = this.padding.front - _hypotenuse * 0.5 - _depth;

        let maxX = _width * 0.5 - this.padding.right * _ratio;
        //let maxY = _frustumSize * 0.5 - this.padding.top * _ratio;
        let maxY = _height * 0.5 - this.padding.top * _ratio;
        let maxZ = - _hypotenuse * 0.5 + this.padding.back;

        _boundbox.min.set(minX, minY, minZ);
        _boundbox.max.set(maxX, maxY, maxZ);

        this.baseBoundbox = _boundbox
        return _boundbox;
    }

    _getWorldPos(pos) {
        let posWorld = pos.clone();

        this.group.updateMatrixWorld();
        posWorld.applyMatrix4(this.group.matrixWorld);
        return posWorld;
    }

    getSize() {
        if (this.boundbox.isEmpty()) {
            this.boundbox = this.getBoundbox();
        }
        this.size = this.boundbox.getSize();
        return this.size;
    }

    dataToPoint(data, dir) {

    }


    pointToData() {

    }

    initCoordUI() {
        //什么都不做
        return null;
    }
    drawUI() {
        // this._root.initComponent();
    }
    dispose() {

    }
    resetData() {

    }

    getAxisDataFrame(fields) {
        let dataFrame = this._root.dataFrame;

        return dataFrame.getDataOrg(fields, function (val) {
            if (val === undefined || val === null || val == "") {
                return val;
            }
            return (isNaN(Number(val)) ? val : Number(val))
        })

    }
    positionToScreen(pos) {
        return positionToScreen.call(this, pos);
    }
    screenToWorld(dx, dy) {
        return screenToWorld.call(this, dx, dy);
    }

}


let positionToScreen = (function () {
    let matrix = new Matrix4();

    return function (pos) {
        let pCam = this._root.renderView._camera;
        const widthHalf = 0.5 * this._root.width;
        const heightHalf = 0.5 * this._root.height;

        let target = this.group.localToWorld(pos);

        target.project(pCam, matrix);

        target.x = (target.x * widthHalf) + widthHalf;
        target.y = (- (target.y * heightHalf) + heightHalf);
        return target;
    }
})();



let screenToWorld = (function () {
    let matrix = new Matrix4();
    //可能有问题,未测试
    return function (dx, dy) {
        let pCam = this._root.renderView.getCamera();
        const widthHalf = this._root.width * 0.5;
        const heightHalf = this._root.height * 0.5;
        let mouse = new Vector2();
        mouse.x = dx / widthHalf - 1;
        mouse.y = -dy / heightHalf + 1;
        //新建一个三维单位向量 假设z方向就是0.5
        //根据照相机，把这个向量转换到视点坐标系

        var target = new Vector3(mouse.x, mouse.y, 0.5).unproject(pCam, matrix);

        // let target = this.group.localToWorld(pos);

        // target.project(pCam, matrix);

        // target.x = (target.x * widthHalf) + widthHalf;
        // target.y = (- (target.y * heightHalf) + heightHalf);
        return target;
    }
})();

export { InertialSystem };