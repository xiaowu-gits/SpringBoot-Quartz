var data_bak;
var row_data;
var openWindow;
var table_title = "定时任务表";
var all_data;
var form;
//初始化加载
$(document).ready(function () {
    layui.use(['layer', 'laydate'], function () {
        layui.laydate.render({
            elem: '#startTime', //指定元素
            type: 'datetime',
            min: Format(new Date(),"yyyy-MM-dd hh:mm:ss"),
            // max: 0, // 最大的时间，数值为正数到负数的正整数，可以为0;意义为选择范围为初始化时间前后浮动范围
        });
    });
    getTab();
});

/**
 * 表格
 */
function getTab(){
    var data = {
        "name" : document.getElementById("search_name").value,   //定时任务名称
        "group" : document.getElementById("search_jobGroup").value,   //定时任务分组
        // "cron" : document.getElementById("search_cron").value,
        // "parameter": document.getElementById("search_parameter").value,
        // "vmParam": document.getElementById("search_vmParam").value,
        // "jarPath": document.getElementById("search_jarPath").value,
    };
    $.ajax({
        url: "/index/getAllTriggers",
        type: "POST",
        // contentType: 'application/json;charset=utf-8',
        // dataType: "json",
        data:data,
        success: function (res) {
            all_data = res;
            layui.config({
                base: '/frame/layui_exts/'
            }).use(['table', 'layer', 'excel'], function(){
                let table = layui.table;
                let layer = layui.layer;
                let form = layui.form;
                let $ = layui.$;
                // let excel = layui.excel;
                //展示已知数据
                table.render({
                    elem: '#tab'
                    ,id: 'modelInfo'
                    ,cols: [[ //标题栏
                        {type:'checkbox'}
                        ,{type: 'numbers', title: '序号', width: "4%"}
                        ,{align: 'center', field: 'name', title: '名称', sort: true}
                        ,{align: 'center', field: 'jobGroup', title: '分组', sort: true}
                        ,{align: 'center', field: 'preTime', title: '上次次执行时间', sort: true}
                        ,{align: 'center', field: 'nextime', title: '下次执行时间', sort: true}
                        ,{align: 'center', field: 'status', title: '当前状态', sort: true}
                        ,{align: 'center', field: 'right', title:'操作', width:"10%", toolbar:'#barDemo'}
                    ]]
                    ,data: res
                    ,page: true //是否显示分页
                    ,limits: [10, 20, 30]
                    ,limit: 20 //每页默认显示的数量
                    ,defaultToolbar: []
                    ,toolbar: "#bar"
                });

                form.verify({
                    module_name: function(value, item) {
                        if(!/^[a-zA-Z0-9_.]+$/.test(value)){
                            return '模块名称由数字、字母、下划线、点号组成';
                        }
                    },
                    parent_name: function (value) {
                        let regExp = new RegExp("^\/[a-zA-Z0-9_.\/]+$");
                        if(!regExp.test(value)){
                            return '路径由斜杠开头，数字、字母、下划线、点号、斜杠组成';
                        }
                    },
                    start_end_time: function (value) {
                        let regExp = new RegExp("^(([0-2][0-3])|([0-1][0-9])):[0-5][0-9][-](([0-2][0-3])|([0-1][0-9])):[0-5][0-9]$");
                        if(!regExp.test(value)){
                            return '时间段输入错误';
                        }
                    },
                });

                table.on('tool(model)', function(obj){
                    //获得当前行数据
                    let layEvent = obj.event;
                    if (layEvent === 'execute') {
                        let res = queryJob(obj.data);
                        if (res.code === 0) {
                            layer.alert("未查到相关任务", {icon: 5, time: 3000});
                            return false;
                        }
                        layer.confirm('确定要立即执行此任务吗', function(index){
                            // layer.close(index);
                            $.ajax({
                                url:"/index/executeTrigger",
                                type: "POST",
                                contentType: 'application/json;charset=utf-8',
                                dataType: "json",
                                data: JSON.stringify(res.data),
                                success: function (res) {
                                    layer.alert(res.msg, {icon: 6, time: 10000});
                                }
                            })
                        });
                    }
                });

                //监听行双击事件
                table.on('rowDouble(model)', function(obj){
                    let data = obj.data;

                    let res = queryJob(data);
                    if (res.code === 0) {
                        layer.alert("未查到相关任务", {icon: 5, time: 3000});
                        return false;
                    }
                    resetData(res.data, form, "s_modelInfo");
                    openWindow = layer.open({
                        type: 1,
                        title: '查看定时任务',
                        // maxmin: true,
                        area: ['800px', '450px'],
                        offset: 'auto',
                        shadeClose: false, //点击遮罩关闭
                        content: $("#s_timeLevel_form")
                    });

                });

                //监听提交
                form.on('submit(save)', function(data){
                    if (row_data["startTime"] === null) {
                        row_data["startTime"] = "";
                    }
                    if (row_data["name"] === data.field["name"]
                        && row_data["jobGroup"] === data.field["jobGroup"]
                        && row_data["cron"] === data.field["cron"]
                        && row_data["parameter"] === data.field["parameter"]
                        && row_data["description"] === data.field["description"]
                        && row_data["vmParam"] === data.field["vmParam"]
                        && row_data["jarPath"] === data.field["jarPath"]
                        && row_data["startTime"] === data.field["startTime"]) {
                        layer.alert("数据未修改", {icon: 5, time: 3000});
                        return false;
                    }

                    if (row_data["name"] !== data.field["name"]
                        || row_data["jobGroup"] !== data.field["jobGroup"]) {
                        var mData = {
                            "name" : data.field["name"],   //定时任务名称
                            "jobGroup" : data.field["jobGroup"],  //定时任务分组
                        };
                        let res = queryJob(mData);
                        if (res.code === 1) {
                            layer.alert("当前组下的任务名称已存在", {icon: 5, time: 3000});
                            return false;
                        }
                    }

                    layer.confirm('确定要修改吗', function(index) {
                        row_data["name"] = data.field["name"];
                        row_data["jobGroup"] = data.field["jobGroup"];
                        row_data["cron"] = data.field["cron"];
                        row_data["parameter"] = data.field["parameter"];
                        row_data["description"] = data.field["description"];
                        row_data["vmParam"] = data.field["vmParam"];
                        row_data["jarPath"] = data.field["jarPath"];
                        row_data["startTime"] = data.field["startTime"];

                        if (!$.isEmptyObject(row_data)) {
                            $.ajax({
                                type: "post",
                                url: "/index/updateTrigger",
                                data: JSON.stringify(row_data),
                                traditional: true,
                                contentType: 'application/json',
                                success: function (result) {
                                    if (result.code === 0) {
                                        layer.alert(result.msg, {icon: 5, time: 3000});
                                    } else {
                                        getTab();
                                        layer.close(openWindow);
                                        layer.alert(result.msg, {icon: 6, time: 3000});
                                    }
                                }
                            });
                        }
                    });
                    return false;
                });

                //监听重置
                layui.$('#save_btn_reset').on('click', function(){
                    resetData(data_bak, form, "modelInfo");
                });

            });
        }
    })
}

function queryJob(trigger) {

    var res = [];

    $.ajax({
        type: "post",
        url: "/index/getJobEntity",
        async:false,
        data: {
            "name" : trigger["name"],   //定时任务名称
            "group" : trigger["jobGroup"],  //定时任务分组
        },
        success: function (result) {
            res = result;
        }
    });
    return res;
}

$(document).on('click', '#reset', function () {
    let form = layui.form;
    form.val('searchlInfo', { //formTest 即 class="layui-form" 所在元素属性 lay-filter="" 对应的值
        "name": ""
        ,"jobGroup": ""
        ,"cron": ""
        ,"parameter": ""
        ,"description": ""
        ,"vmParam": ""
    });
});

//定时任务 添加点击事件
$(document).on('click', '#btn-add', function () {
    let form = layui.form;
    $("#add_btn").css("display", "");
    $("#save_btn").css("display", "none");
    $("#add_btn_reset").css("display", "");
    $("#save_btn_reset").css("display", "none");
    openWindow = layer.open({
        type: 1,
        title: '新增定时任务',
        // maxmin: true,
        area: ['800px', '500px'],
        offset: 'auto',
        shadeClose: false, //点击遮罩关闭
        content: $("#timeLevel_form")
    });
    resetData(getAddData(), form, 'modelInfo');

    //监听提交
    form.on('submit(add)', function(data){

        var mData = {
            "name" : data.field["name"],   //定时任务名称
            "jobGroup" : data.field["jobGroup"],  //定时任务分组
        };
        let res = queryJob(mData);
        if (res.code === 1) {
            layer.alert("当前组下的任务名称已存在", {icon: 5, time: 3000});
            return false;
        }

        layer.confirm('确定要添加吗', function(index) {
            let cronData = {};
            cronData["name"] = data.field["name"];
            cronData["jobGroup"] = data.field["jobGroup"];
            cronData["cron"] = data.field["cron"];
            cronData["parameter"] = data.field["parameter"];
            cronData["description"] = data.field["description"];
            cronData["vmParam"] = data.field["vmParam"];
            cronData["jarPath"] = data.field["jarPath"];
            cronData["startTime"] = data.field["startTime"];
            // debugger;
            if (!$.isEmptyObject(cronData)) {
                $.ajax({
                    type: "post",
                    url: "/index/addTrigger",
                    data: JSON.stringify(cronData),
                    traditional: true,
                    contentType: 'application/json',
                    success: function (result) {
                        if (result.code === 0) {
                            layer.alert(result.msg, {icon: 5, time: 3000});
                        } else {
                            getTab();
                            layer.alert(result.msg, {icon: 6, time: 3000});
                        }
                    }
                });
            }
        });
        return false;
    });

    //监听重置
    layui.$('#add_btn_reset').on('click', function(){
        resetData(getAddData(), form, 'modelInfo');
    });
});
//修改点击事件
$(document).on('click', '#btn-save', function () {
    //判断是否选中1条数据
    var table = layui.table;
    var checkStatus = table.checkStatus('modelInfo');
    if(checkStatus.data.length==0){
        layer.msg('请先选择要修改的数据行！', {icon: 2});
        return ;
    }else if (checkStatus.data.length > 1){
        layer.msg('请先选择一条数据进行修改！', {icon: 2});
        return ;
    }
    //弹出修改页面
    var form = layui.form;
    $("#add_btn").css("display", "none");
    $("#save_btn").css("display", "");
    $("#add_btn_reset").css("display", "none");
    $("#save_btn_reset").css("display", "");
    let trigger = checkStatus.data[0];
    debugger;
    let res = queryJob(trigger);

    if (res.code === 0) {
        layer.alert('未查到相关任务', {icon: 5, time: 3000});
        return;
    } else {
        if (res.data["startTime"] === null) {
            res.data["startTime"] = "";
        }
        row_data = res.data;
    }
    data_bak = deepClone(row_data);
    resetData(row_data, form, 'modelInfo');
    openWindow = layer.open({
        type: 1,
        title: '修改定时任务',
        // maxmin: true,
        area: ['800px', '500px'],
        offset: 'auto',
        shadeClose: false, //点击遮罩关闭
        content: $("#timeLevel_form")
    });

});

//初始化添加时次form表单数据
function resetData(data, form, lay_filter) {
    form.val(lay_filter, { //formTest 即 class="layui-form" 所在元素属性 lay-filter="" 对应的值
        "name": data["name"]
        ,"jobGroup": data["jobGroup"]
        ,"cron": data["cron"]
        ,"parameter": data["parameter"]
        ,"description": data["description"]
        ,"vmParam": data["vmParam"]
        ,"jarPath": data["jarPath"]
        ,"startTime": data["startTime"]
        ,"className": data["className"]
    });
}

//获取添加时次初始化数据
function getAddData() {
    let data = {
        name: "",
        jobGroup:"",
        cron: "",
        parameter:"",
        description: "",
        vmParam: "",
        jarPath: "",
        startTime: "",
        className: ""
    };
    return data;
}

/**
 * 查询
 */
//查询点击事件
$(document).on('click', '#search_btn', function () {
    getTab();
});

//定时任务删除
$(document).on('click', '#btn-del', function () {
    var table = layui.table;
    var checkStatus = table.checkStatus('modelInfo');
    if(checkStatus.data.length < 1){
        layer.msg('请先选择要删除的数据行！', {icon: 2});
        return;
    }
    let triggers = [];
    for(let i in checkStatus.data){
        triggers.push(checkStatus.data[i]);
    }
    layer.confirm('确定要删除吗', function(index) {
        $.ajax({
            type: "post",
            data: JSON.stringify(triggers),
            traditional: true,
            contentType: 'application/json',
            url: "/index/deleteTrigger",
            success: function (res) {
                getTab();
                layer.alert(res.msg, {icon: 6, time: 10000});
            }
        })
    });
});

//暂停定时任务
$(document).on('click', '#btn-pause', function () {
    var table = layui.table;
    var checkStatus = table.checkStatus('modelInfo');
    if(checkStatus.data.length < 1){
        layer.msg('请先选择要暂停的数据行！', {icon: 2});
        return;
    }
    let triggers = [];
    for(let i in checkStatus.data){
        triggers.push(checkStatus.data[i]);
    }
    layer.confirm('确定要暂停吗', function(index) {
        $.ajax({
            type: "post",
            data: JSON.stringify(triggers),
            traditional: true,
            contentType: 'application/json',
            url: "/index/pauseTrigger",
            success: function (res) {
                getTab();
                layer.alert(res.msg, {icon: 6, time: 10000});
            }
        })
    });
});

//重置定时任务
$(document).on('click', '#btn-resume', function () {
    var table = layui.table;
    var checkStatus = table.checkStatus('modelInfo');
    if(checkStatus.data.length < 1){
        layer.msg('请先选择要重置的数据行！', {icon: 2});
        return;
    }
    let triggers = [];
    for(let i in checkStatus.data){
        triggers.push(checkStatus.data[i]);
    }
    layer.confirm('确定要重置吗', function(index) {
        $.ajax({
            type: "post",
            data: JSON.stringify(triggers),
            traditional: true,
            contentType: 'application/json',
            url: "/index/resumeTrigger",
            success: function (res) {
                getTab();
                layer.alert(res.msg, {icon: 6, time: 10000});
            }
        })
    });
});

function showContextMenu() {
    var obj = $("#export");
    var inputOffset = $("#export").offset();
    $("#treeContextMenu").css({
        left : (inputOffset.left-70) + "px",
        top : inputOffset.top + obj.outerHeight() + "px"
    }).slideDown("fast");
    $("body").on("mousedown", onBodyMouseDown);
}


function hideContextMenu() {
    $("#treeContextMenu").hide();
    $("body").off("mousedown", onBodyMouseDown);
}

function onBodyMouseDown(event) {
    if (!(event.target.id == "treeContextMenu" || $(event.target).parents("#treeContextMenu").length > 0)) {
        hideContextMenu();
    }
}

$(document).on("click", "#export_part", function () {
    export_part_File('modelInfo');
});

$(document).on("click", "#export_all", function () {
    exportFile('modelInfo', all_data);
});

function export_part_File(id) {
    let excel = layui.excel;
    //根据传入tableID获取表头
    let headers = $("div[lay-id=" + id + "] .layui-table-box table").get(0);
    let htrs = Array.from(headers.querySelectorAll('tr'));
    let titles = {};
    let fields = [];
    for (let j = 0; j < htrs.length; j++) {
        let hths = Array.from(htrs[j].querySelectorAll("th"));
        for (let i = 0; i < hths.length; i++) {
            let clazz = hths[i].getAttributeNode('class').value;
            if (clazz != ' layui-table-col-special' && clazz != 'layui-unselect layui-hide') {
                //排除居左、具有、隐藏字段
                //修改:默认字段data-field+i,兼容部分数据表格中不存在data-field值的问题
                titles['data-field' + i] = hths[i].innerText;
                fields['data-field' + i] = hths[i].dataset.field;
            }
        }
    }
    //根据传入tableID获取table内容
    let bodys = $("div[lay-id=" + id + "] .layui-table-box table").get(1);
    let btrs = Array.from(bodys.querySelectorAll("tr"))
    let bodysArr = new Array();
    for (let j = 0; j < btrs.length; j++) {
        let contents = {};
        let btds = Array.from(btrs[j].querySelectorAll("td"));
        for (let i = 0; i < btds.length; i++) {
            for (let key in titles) {
                //修改:默认字段data-field+i,兼容部分数据表格中不存在data-field值的问题
                let field = 'data-field' + i;
                if (field === key) {
                    //根据表头字段获取table内容字段
                    contents[field] = btds[i].innerText;
                }
            }
        }
        bodysArr.push(contents)
    }
    //将标题行置顶添加到数组
    bodysArr.unshift(titles);
    //导出excel
    excel.exportExcel(bodysArr, table_title + new Date().toLocaleDateString() + '.xlsx', 'xlsx');
}


function exportFile(id, data) {
    if (typeof data == 'undefined' || data == null) {
        data = [];
    }

    let excel = layui.excel;
    //根据传入tableID获取表头
    let headers = $("div[lay-id=" + id + "] .layui-table-box table").get(0);
    let htrs = Array.from(headers.querySelectorAll('tr'));
    let titles = {};
    let fields = [];
    for (let j = 0; j < htrs.length; j++) {
        let hths = Array.from(htrs[j].querySelectorAll("th"));
        for (let i = 0; i < hths.length; i++) {
            let clazz = hths[i].getAttributeNode('class').value;
            if (clazz != ' layui-table-col-special' && clazz != 'layui-unselect layui-hide') {
                //排除居左、具有、隐藏字段
                //修改:默认字段data-field+i,兼容部分数据表格中不存在data-field值的问题
                titles[i] = hths[i].innerText;
                fields[i] = hths[i].dataset.field;
            }
        }
    }

    let bodysArr = new Array();
    for (let j = 0; j < data.length; j++) {
        let contents = {};
        for (let key in fields) {
            let fieldName = fields[key];
            contents[key] = data[j][fieldName];
        }
        bodysArr.push(contents)
    }
    //将标题行置顶添加到数组
    bodysArr.unshift(titles);
    //导出excel
    excel.exportExcel(bodysArr, table_title + new Date().toLocaleDateString() + '.xlsx', 'xlsx');
}

function refreshTable() {
    getTab();
}