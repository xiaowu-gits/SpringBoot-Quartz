// 页面背景色
var bgcolor = '#C2E7F7';

/**
 * 时间格式化
 * @param datetime
 * @param fmt
 * @returns {*}
 * @constructor
 */
function Format(datetime,fmt) {
    if (typeof datetime === "undefined" || datetime === '') {
        return '';
    }
    if (parseInt(datetime)==datetime) {
        if (datetime.length==10) {
            datetime=parseInt(datetime)*1000;
        } else if(datetime.length==13) {
            datetime=parseInt(datetime);
        }
    }
    datetime=new Date(datetime);
    var o = {
        "M+" : datetime.getMonth()+1,                 //月份
        "d+" : datetime.getDate(),                    //日
        "h+" : datetime.getHours(),                   //小时
        "m+" : datetime.getMinutes(),                 //分
        "s+" : datetime.getSeconds(),                 //秒
        "q+" : Math.floor((datetime.getMonth()+3)/3), //季度
        "S"  : datetime.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (datetime.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}

/**
 * 后台下载文件
 * @param options
 * @constructor
 */
var downLoadFile = function (options) {
    var config = $.extend(true, { method: 'post' }, options);
    var $iframe = $('<iframe id="down-file-iframe" />');
    var $form = $('<form target="down-file-iframe" method="' + config.method + '" />');
    $form.attr('action', config.url);
    for (var key in config.data) {
        $form.append('<input type="hidden" name="' + key + '" value="' + config.data[key] + '" />');
    }
    $iframe.append($form);
    $(document.body).append($iframe);
    $form[0].submit();
    $iframe.remove();
};

/**
 *
 * @param select_id   select 选择框id
 * @param select_id   select 选择框id
 * @param search_tf   是否开始模糊匹配搜索
 * @param select_tf   是否默认全部选中
 * @param radio_tf    是否开启单选，true为单选，false 为多选
 * @param name        text 文本数组
 * @param value       option的  的value
 */
function create_many_select(select_id,search_tf,select_tf,radio_tf,name,value,list) {
    var select_data=[];
    $.each(name,function (n,vn) {
        if (select_tf==true){
            var json={name: vn, value: value[n], selected: true};
            select_data.push(json);
        } else {
            var json={name: vn, value: value[n]};
            select_data.push(json);
        }
    });
    let select_uservalue = xmSelect.render({
        el: select_id,
        language: 'zn',
        toolbar: {
            show: true,
            showIcon: false,
            list: list
        },

        radio:radio_tf,
        filterable: search_tf,
        paging: false,
        height:"350px",
        data: select_data
    });
    return select_uservalue;
}

// 迭代递归法：深拷贝对象与数组
function deepClone(obj) {
    let isArray = Array.isArray(obj)
    let cloneObj = isArray ? [] : {}
    for (let key in obj) {
        cloneObj[key] = isObject(obj[key]) ? deepClone(obj[key]) : obj[key]
    }
    return cloneObj
}

// 判断是否为对象
function isObject(o) {
    return (typeof o === 'object' || typeof o === 'function') && o !== null
}

// 设置cookie
function setCookie(c_name, value, expiremMinutes) {
    var exdate = new Date();
    if (expiremMinutes) {
        exdate.setTime(exdate.getTime() + expiremMinutes * 60 * 1000);
    }
    document.cookie = c_name + "=" + escape(value) + ((expiremMinutes == null) ? "" : ";expires=" + exdate.toUTCString()) + ";path=/";
}

// 读取cookie
function getCookie(c_name) {
    if (document.cookie.length > 0) {
        var c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            var c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1)
                c_end = document.cookie.length;
            return unescape(document.cookie.substring(c_start, c_end))
        }
    }
    return ""
}

// 删除cookie
function delCookie(c_name) {
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval = this.getCookie(c_name);
    if (cval != null) {
        document.cookie = c_name + "=" + cval + ";expires=" + exp.toGMTString() + ";path=/";
    }
}