/**
 * bootstrap-table - An extended Bootstrap table with radio, checkbox, sort, pagination, and other added features. (supports twitter bootstrap v2 and v3).
 *
 * @version v1.14.2
 * @homepage https://bootstrap-table.com
 * @author wenzhixin <wenzhixin2010@gmail.com> (http://wenzhixin.net.cn/)
 * @license MIT
 */

(function(a, b) {
        if ('function' == typeof define && define.amd)
            define([], b);
        else if ('undefined' != typeof exports)
            b();
        else {
            b(),
                a.bootstrapTableExport = {
                    exports: {}
                }.exports
        }
    }
)(this, function() {
    'use strict';
    function a(a, b, c) {
        return b in a ? Object.defineProperty(a, b, {
            value: c,
            enumerable: !0,
            configurable: !0,
            writable: !0
        }) : a[b] = c,
            a
    }
    function b(a, b) {
        if (!(a instanceof b))
            throw new TypeError('Cannot call a class as a function')
    }
    function c(a, b) {
        if (!a)
            throw new ReferenceError('this hasn\'t been initialised - super() hasn\'t been called');
        return b && ('object' == typeof b || 'function' == typeof b) ? b : a
    }
    function d(a, b) {
        if ('function' != typeof b && null !== b)
            throw new TypeError('Super expression must either be null or a function, not ' + typeof b);
        a.prototype = Object.create(b && b.prototype, {
            constructor: {
                value: a,
                enumerable: !1,
                writable: !0,
                configurable: !0
            }
        }),
        b && (Object.setPrototypeOf ? Object.setPrototypeOf(a, b) : a.__proto__ = b)
    }
    var e = function() {
        function a(a, b) {
            for (var c, d = 0; d < b.length; d++)
                c = b[d],
                    c.enumerable = c.enumerable || !1,
                    c.configurable = !0,
                'value'in c && (c.writable = !0),
                    Object.defineProperty(a, c.key, c)
        }
        return function(b, c, d) {
            return c && a(b.prototype, c),
            d && a(b, d),
                b
        }
    }()
        , f = function a(b, c, d) {
        null === b && (b = Function.prototype);
        var e = Object.getOwnPropertyDescriptor(b, c);
        if (e === void 0) {
            var f = Object.getPrototypeOf(b);
            return null === f ? void 0 : a(f, c, d)
        }
        if ('value'in e)
            return e.value;
        var g = e.get;
        return void 0 === g ? void 0 : g.call(d)
    };
    (function(g) {
            var h = g.fn.bootstrapTable.utils
                , i = {
                3: {
                    icons: {
                        export: 'glyphicon-export icon-share'
                    },
                    html: {
                        dropmenu: '<ul class="dropdown-menu" role="menu"></ul>',
                        dropitem: '<li role="menuitem" data-type="%s"><a href="javascript:">%s</a></li>'
                    }
                },
                4: {
                    icons: {
                        export: 'fa-download'
                    },
                    html: {
                        dropmenu: '<div class="dropdown-menu dropdown-menu-right"></div>',
                        dropitem: '<a class="dropdown-item" data-type="%s" href="javascript:">%s</a>'
                    }
                }
            }[h.bootstrapVersion]
                , j = {
                json: 'JSON',
                xml: 'XML',
                png: 'PNG',
                csv: 'CSV',
                txt: 'TXT',
                sql: 'SQL',
                doc: 'MS-Word',
                excel: 'MS-Excel',
                xlsx: 'MS-Excel (OpenXML)',
                powerpoint: 'MS-Powerpoint',
                pdf: 'PDF'
            };
            g.extend(g.fn.bootstrapTable.defaults, {
                showExport: !1,
                exportDataType: 'basic',
                exportTypes: ['json', 'xml', 'csv', 'txt', 'sql', 'excel'],
                exportOptions: {},
                exportFooter: !1
            }),
                g.extend(g.fn.bootstrapTable.defaults.icons, {
                    export: i.icons.export
                }),
                g.extend(g.fn.bootstrapTable.locales, {
                    formatExport: function() {
                        return 'Export data'
                    }
                }),
                g.extend(g.fn.bootstrapTable.defaults, g.fn.bootstrapTable.locales),
                g.fn.bootstrapTable.methods.push('exportTable'),
                g.BootstrapTable = function(k) {
                    function l() {
                        return b(this, l),
                            c(this, (l.__proto__ || Object.getPrototypeOf(l)).apply(this, arguments))
                    }
                    return d(l, k),
                        e(l, [{
                            key: 'initToolbar',
                            value: function() {
                                var a = this
                                    , b = this.options;
                                if (this.showToolbar = this.showToolbar || b.showExport,
                                        f(l.prototype.__proto__ || Object.getPrototypeOf(l.prototype), 'initToolbar', this).call(this),
                                        !!this.options.showExport) {
                                    var c = this.$toolbar.find('>.btn-group');
                                    if (this.$export = c.find('div.export'),
                                            this.$export.length)
                                        return void this.updateExportButton();
                                    this.$export = g('\n        <div class="export btn-group">\n        <button class="btn btn-' + b.buttonsClass + ' btn-' + b.iconSize + ' dropdown-toggle"\n          aria-label="export type"\n          title="' + b.formatExport() + '"\n          data-toggle="dropdown"\n          type="button">\n          <i class="' + b.iconsPrefix + ' ' + b.icons.export + '"></i>\n          <span class="caret"></span>\n        </button>\n        ' + i.html.dropmenu + '\n        </div>\n      ').appendTo(c),
                                        this.updateExportButton();
                                    var d = this.$export.find('.dropdown-menu')
                                        , e = b.exportTypes;
                                    if ('string' == typeof e) {
                                        var q = e.slice(1, -1).replace(/ /g, '').split(',');
                                        e = q.map(function(a) {
                                            return a.slice(1, -1)
                                        })
                                    }
                                    for (var k = e, m = Array.isArray(k), n = 0, _iterator = m ? k : k[Symbol.iterator](); ; ) {
                                        var o;
                                        if (m) {
                                            if (n >= k.length)
                                                break;
                                            o = k[n++]
                                        } else {
                                            if (n = k.next(),
                                                    n.done)
                                                break;
                                            o = n.value
                                        }
                                        var p = o;
                                        j.hasOwnProperty(p) && d.append(h.sprintf(i.html.dropitem, p, j[p]))
                                    }
                                    d.find('>li, >a').click(function(b) {
                                        var c = b.currentTarget
                                            , d = g(c).data('type');
                                        a.exportTable({
                                            type: d,
                                            escape: !1
                                        })
                                    })
                                }
                            }
                        }, {
                            key: 'exportTable',
                            value: function(b) {
                                var c = this
                                    , d = this.options
                                    , e = this.header.stateField
                                    , f = d.cardView
                                    , h = function(a) {
                                    e && c.hideColumn(e),
                                    f && c.toggleView();
                                    var h = c.getData();
                                    if (d.exportFooter) {
                                        var i = c.$tableFooter.find('tr').first()
                                            , j = {}
                                            , k = [];
                                        g.each(i.children(), function(a, b) {
                                            var d = g(b).children('.th-inner').first().html();
                                            j[c.columns[a].field] = '&nbsp;' === d ? null : d,
                                                k.push(d)
                                        }),
                                            c.append(j);
                                        var l = c.$body.children().last();
                                        g.each(l.children(), function(a, b) {
                                            g(b).html(k[a])
                                        })
                                    }
                                    c.$el.tableExport(g.extend({
                                        onAfterSaveToFile: function() {
                                            d.exportFooter && c.load(h),
                                            e && c.showColumn(e),
                                            f && c.toggleView()
                                        }
                                    }, d.exportOptions, b))
                                };
                                if ('all' === d.exportDataType && d.pagination) {
                                    var k = 'server' === d.sidePagination ? 'post-body.bs.table' : 'page-change.bs.table';
                                    this.$el.one(k, function() {
                                        h(function() {
                                            c.togglePagination()
                                        })
                                    }),
                                        this.togglePagination()
                                } else if ('selected' === d.exportDataType) {
                                    var i = this.getData()
                                        , j = this.getSelections();
                                    if (!j.length)
                                        return;
                                    'server' === d.sidePagination && (i = a({
                                        total: d.totalRows
                                    }, this.options.dataField, i),
                                        j = a({
                                            total: j.length
                                        }, this.options.dataField, j)),
                                        this.load(j),
                                        h(function() {
                                            c.load(i)
                                        })
                                } else
                                    h()
                            }
                        }, {
                            key: 'updateSelected',
                            value: function() {
                                f(l.prototype.__proto__ || Object.getPrototypeOf(l.prototype), 'updateSelected', this).call(this),
                                    this.updateExportButton()
                            }
                        }, {
                            key: 'updateExportButton',
                            value: function() {
                                'selected' === this.options.exportDataType && this.$export.find('> button').prop('disabled', !this.getSelections().length)
                            }
                        }]),
                        l
                }(g.BootstrapTable)
        }
    )(jQuery)
});
