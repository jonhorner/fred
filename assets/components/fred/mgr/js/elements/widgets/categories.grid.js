fred.grid.ElementCategories = function (config) {
    config = config || {};

    Ext.applyIf(config, {
        url: fred.config.connectorUrl,
        baseParams: {
            action: 'mgr/element_categories/getlist',
            sort: 'rank',
            dir: 'asc'
        },
        save_action: 'mgr/element_categories/updatefromgrid',
        autosave: true,
        preventSaveRefresh: false,
        fields: ['id', 'name', 'rank', 'elements'],
        ddGroup: 'FredElementCategoriesDDGroup',
        enableDragDrop: true,
        paging: true,
        remoteSort: true,
        emptyText: _('fred.element_categories.none'),
        columns: [
            {
                header: _('id'),
                dataIndex: 'id',
                sortable: true,
                hidden: true
            },
            {
                header: _('fred.element_categories.name'),
                dataIndex: 'name',
                sortable: true,
                width: 80,
                editor: {xtype: 'textfield'}
            },
            {
                header: _('fred.element_categories.number_of_elements'),
                dataIndex: 'elements',
                sortable: true,
                width: 80
            },
            {
                header: _('fred.element_categories.rank'),
                dataIndex: 'rank',
                sortable: true,
                width: 80,
                editor: {xtype: 'numberfield'}
            }
        ],
        tbar: [
            {
                text: _('fred.element_categories.create'),
                handler: this.createCategory
            },
            '->',
            {
                xtype: 'textfield',
                emptyText: _('fred.element_categories.search_name'),
                listeners: {
                    'change': {
                        fn: this.search,
                        scope: this
                    },
                    'render': {
                        fn: function (cmp) {
                            new Ext.KeyMap(cmp.getEl(), {
                                key: Ext.EventObject.ENTER,
                                fn: function () {
                                    this.blur();
                                    return true;
                                },
                                scope: cmp
                            });
                        },
                        scope: this
                    }
                }
            }
        ]
    });
    fred.grid.ElementCategories.superclass.constructor.call(this, config);

    this.on('render', this.registerGridDropTarget, this);
    this.on('beforedestroy', this.destroyScrollManager, this);
};
Ext.extend(fred.grid.ElementCategories, MODx.grid.Grid, {
    getMenu: function () {
        var m = [];

        m.push({
            text: _('fred.element_categories.update'),
            handler: this.updateCategory
        });

        m.push('-');

        m.push({
            text: _('fred.element_categories.duplicate'),
            handler: this.duplicateCategory
        });
        
        m.push('-');

        m.push({
            text: _('fred.element_categories.remove'),
            handler: this.removeCategory
        });
        return m;
    },

    createCategory: function (btn, e) {
        var createCategory = MODx.load({
            xtype: 'fred-window-element-category',
            listeners: {
                success: {
                    fn: function () {
                        this.refresh();
                    },
                    scope: this
                }
            }
        });

        createCategory.show(e.target);

        return true;
    },

    updateCategory: function (btn, e) {
        var updateCategory = MODx.load({
            xtype: 'fred-window-element-category',
            title: _('fred.element_categories.update'),
            action: 'mgr/element_categories/update',
            isUpdate: true,
            record: this.menu.record,
            listeners: {
                success: {
                    fn: function () {
                        this.refresh();
                    },
                    scope: this
                }
            }
        });

        updateCategory.fp.getForm().reset();
        updateCategory.fp.getForm().setValues(this.menu.record);
        updateCategory.show(e.target);

        return true;
    },
    
    duplicateCategory: function (btn, e) {
        var duplicateCategory = MODx.load({
            xtype: 'fred-window-element-category-duplicate',
            title: _('fred.element_categories.duplicate'),
            action: 'mgr/element_categories/duplicate',
            isUpdate: true,
            record: this.menu.record,
            listeners: {
                success: {
                    fn: function () {
                        this.refresh();
                    },
                    scope: this
                }
            }
        });

        duplicateCategory.fp.getForm().reset();
        duplicateCategory.fp.getForm().setValues(this.menu.record);
        duplicateCategory.show(e.target);

        return true;
    },

    removeCategory: function (btn, e) {
        if (!this.menu.record) return false;

        var elements = parseInt(this.menu.record.elements);
        var text;

        if (elements === 0) {
            text = _('fred.element_categories.remove_confirm_empty', {name: this.menu.record.name});
        } else if (elements === 1) {
            text = _('fred.element_categories.remove_confirm_singular', {name: this.menu.record.name, elements: elements});
        } else {
            text = _('fred.element_categories.remove_confirm', {name: this.menu.record.name, elements: elements});
        }

        MODx.msg.confirm({
            title: _('fred.element_categories.remove'),
            text: text,
            url: this.config.url,
            params: {
                action: 'mgr/element_categories/remove',
                id: this.menu.record.id
            },
            listeners: {
                success: {
                    fn: function (r) {
                        this.refresh();
                    },
                    scope: this
                }
            }
        });

        return true;
    },

    search: function (field, value) {
        var s = this.getStore();
        s.baseParams.search = value;
        this.getBottomToolbar().changePage(1);
    },

    filterCombo: function (combo, record) {
        var s = this.getStore();
        s.baseParams[combo.filterName] = record.data.v;
        this.getBottomToolbar().changePage(1);
    },

    isGridFiltered: function () {
        var search = this.getStore().baseParams.search;
        if (search && search != '') {
            return true;
        }

        var publicFilter = this.getStore().baseParams.public;
        if ((publicFilter !== undefined) && (publicFilter !== null) && (publicFilter !== '')) {
            return true;
        }

        return false;
    },

    getDragDropText: function () {
        if (this.store.sortInfo && this.store.sortInfo.field != 'rank') {
            return _('fred.err.bad_sort_column', {column: 'rank'});
        }

        if (this.isGridFiltered()) {
            return _('fred.err.clear_filter');
        }

        return _('fred.global.change_order', {name: this.selModel.selections.items[0].data.name});
    },

    registerGridDropTarget: function () {

        var ddrow = new Ext.ux.dd.GridReorderDropTarget(this, {
            copy: false,
            sortCol: 'rank',
            isGridFiltered: this.isGridFiltered.bind(this),
            listeners: {
                'beforerowmove': function (objThis, oldIndex, newIndex, records) {
                },

                'afterrowmove': function (objThis, oldIndex, newIndex, records) {
                    MODx.Ajax.request({
                        url: fred.config.connectorUrl,
                        params: {
                            action: 'mgr/element_categories/ddreorder',
                            categoryId: records.pop().id,
                            oldIndex: oldIndex,
                            newIndex: newIndex
                        },
                        listeners: {
                            'success': {
                                fn: function (r) {
                                    this.target.grid.refresh();
                                },
                                scope: this
                            }
                        }
                    });
                },

                'beforerowcopy': function (objThis, oldIndex, newIndex, records) {
                },

                'afterrowcopy': function (objThis, oldIndex, newIndex, records) {
                }
            }
        });

        Ext.dd.ScrollManager.register(this.getView().getEditorParent());
    },

    destroyScrollManager: function () {
        Ext.dd.ScrollManager.unregister(this.getView().getEditorParent());
    }
});
Ext.reg('fred-grid-element-categories', fred.grid.ElementCategories);