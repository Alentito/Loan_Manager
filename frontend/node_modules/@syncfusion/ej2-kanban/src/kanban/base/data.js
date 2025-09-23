/* eslint-disable @typescript-eslint/no-explicit-any */
import { extend, isNullOrUndefined, formatUnit } from '@syncfusion/ej2-base';
import { DataManager, Query, Deferred, UrlAdaptor } from '@syncfusion/ej2-data';
import * as events from './constant';
/**
 * Kanban data module
 */
var Data = /** @class */ (function () {
    /**
     * Constructor for data module
     *
     * @param {Kanban} parent Accepts the instance of the Kanban
     */
    function Data(parent) {
        this.initload = false;
        this.dataState = { isPending: false, resolver: null, isDataChanged: false };
        this.parent = parent;
        this.keyField = this.parent.cardSettings.headerField;
        this.dataState = { isDataChanged: false };
        this.isObservable = false;
        this.initDataManager(parent.dataSource, parent.query);
        this.refreshDataManager();
    }
    /**
     * The function used to initialize dataManager` and query
     *
     * @param {Object[] | DataManager} dataSource Accepts the dataSource as collection of objects or Datamanager instance.
     * @param {Query} query Accepts the query to process the data from collections.
     * @returns {void}
     * @private
     */
    Data.prototype.initDataManager = function (dataSource, query) {
        this.dataManager = dataSource instanceof DataManager ? dataSource : new DataManager(dataSource);
        this.query = query instanceof Query ? query : new Query();
        this.kanbanData = new DataManager(this.parent.kanbanData);
    };
    /**
     * @returns {boolean} returns whether its remote data
     * @hidden
     */
    Data.prototype.isRemote = function () {
        return this.dataManager.dataSource.offline !== true && this.dataManager.dataSource.url !== undefined &&
            this.dataManager.dataSource.url !== '';
    };
    /**
     * @returns {boolean} returns the column key fields
     * @hidden
     */
    Data.prototype.columnKeyFields = function () {
        var columns = [];
        for (var _i = 0, _a = this.parent.columns; _i < _a.length; _i++) {
            var column = _a[_i];
            if (column.keyField.toString().split(',').length > 1) {
                for (var _b = 0, _c = column.keyField.toString().split(','); _b < _c.length; _b++) {
                    var innerColumns = _c[_b];
                    columns.push(innerColumns.trim());
                }
            }
            else {
                columns.push(column.keyField.toString());
            }
        }
        return columns;
    };
    /**
     * The function used to generate updated Query from schedule model
     *
     * @param {string} parameter Accepts the parameter that needs to be sent to the service end.
     * @returns {void}
     * @private
     */
    Data.prototype.getQuery = function (parameter) {
        var query = this.query.clone();
        if (this.isRemote() && this.parent.enableVirtualization) {
            var cardHeight = this.parent.cardHeight === 'auto' ? 100 :
                parseInt(formatUnit(this.parent.cardHeight).split('px')[0], 10);
            var take = this.parent.height === 'auto' ? (Math.ceil(window.innerHeight / cardHeight) * 2) :
                (Math.ceil(parseInt(formatUnit(this.parent.height).split('px')[0], 10) / cardHeight) * 2);
            var columns = this.columnKeyFields();
            for (var i = 0; i < columns.length; i++) {
                query.where(this.parent.keyField, 'equal', columns[i]);
            }
            query.take(take);
            if (isNullOrUndefined(parameter)) {
                parameter = 'KanbanVirtualization';
            }
            query.addParams('KanbanVirtualization', parameter);
        }
        return query;
    };
    /**
     * The function used to get dataSource by executing given Query
     *
     * @param  {Query} query - A Query that specifies to generate dataSource
     * @returns {void}
     * @private
     */
    Data.prototype.getData = function (query) {
        if (this.parent.dataSource && 'result' in this.parent.dataSource) {
            var def = this.eventPromise({ requestType: '' }, query);
            this.isObservable = true;
            return def.promise;
        }
        return this.dataManager.executeQuery(query);
    };
    Data.prototype.setState = function (state) {
        return this.dataState = state;
    };
    Data.prototype.getStateEventArgument = function (query) {
        var adaptr = new UrlAdaptor();
        var dm = new DataManager({ url: '', adaptor: new UrlAdaptor });
        var state = adaptr.processQuery(dm, query);
        var data = JSON.parse(state.data);
        return extend(data, state.pvtData);
    };
    Data.prototype.eventPromise = function (args, query, index) {
        var _this = this;
        var dataArgs = args;
        var state = this.getStateEventArgument(query);
        var def = new Deferred();
        var deff = new Deferred();
        if (args.requestType !== undefined && this.dataState.isDataChanged !== false) {
            state.action = args;
            if (args.requestType === 'cardChanged' || args.requestType === 'cardRemoved' || args.requestType === 'cardCreated') {
                var editArgs_1 = args;
                editArgs_1.promise = deff.promise;
                editArgs_1.state = state;
                editArgs_1.index = index;
                this.setState({ isPending: true, resolver: deff.resolve });
                dataArgs.endEdit = deff.resolve;
                dataArgs.cancelEdit = deff.reject;
                this.parent.trigger(events.dataSourceChanged, editArgs_1);
                deff.promise.then(function () {
                    _this.setState({ isPending: true, resolver: def.resolve });
                    _this.parent.trigger(events.dataStateChange, state);
                    editArgs_1.addedRecords.forEach(function (data) {
                        _this.parent.kanbanData.push(data);
                    });
                    editArgs_1.changedRecords.forEach(function (changedRecord) {
                        var cardObj = _this.parent.kanbanData.filter(function (data) {
                            return data[_this.parent.cardSettings.headerField] ===
                                changedRecord[_this.parent.cardSettings.headerField];
                        })[0];
                        extend(cardObj, changedRecord);
                    });
                    editArgs_1.deletedRecords.forEach(function (deletedRecord) {
                        var index = _this.parent.kanbanData.findIndex(function (data) {
                            return data[_this.parent.cardSettings.headerField] === deletedRecord[_this.parent.cardSettings.headerField];
                        });
                        _this.parent.kanbanData.splice(index, 1);
                    });
                }).catch(function () { _this.parent.hideSpinner(); void 0; });
            }
            else {
                this.setState({ isPending: true, resolver: def.resolve });
                this.parent.trigger(events.dataStateChange, state);
            }
        }
        else {
            this.setState({});
            def.resolve(this.parent.dataSource);
        }
        return def;
    };
    /**
     * The function used to get the table name from the given Query
     *
     * @returns {string} Returns the table name.
     * @private
     */
    Data.prototype.getTable = function () {
        if (this.parent.query) {
            var query = this.getQuery();
            return query.fromTable;
        }
        else {
            return null;
        }
    };
    /**
     * The function is used to send the request and get response from datamanager
     *
     * @returns {void}
     * @private
     */
    Data.prototype.refreshDataManager = function () {
        var _this = this;
        var dataManager = this.getData(this.getQuery());
        dataManager.then(function (e) {
            return _this.dataManagerSuccess(e);
        }).catch(function (e) { return _this.dataManagerFailure(e); });
    };
    /**
     * The function is used to handle the success response from dataManager
     *
     * @param {ReturnType} e Accepts the dataManager success result
     * @param type
     * @returns {void}
     * @private
     */
    // eslint-disable-next-line
    Data.prototype.dataManagerSuccess = function (e, type, offlineArgs, index) {
        var _this = this;
        if (this.parent.isDestroyed) {
            return;
        }
        if (type) {
            this.updateKanbanData(e);
            if (this.parent.enableVirtualization && this.isRemote()) {
                this.parent.virtualLayoutModule.refresh();
            }
        }
        else {
            this.parent.trigger(events.dataBinding, e, function (args) {
                _this.updateKanbanData(args);
                _this.parent.notify(events.dataReady, { processedData: _this.parent.kanbanData });
                _this.parent.trigger(events.dataBound, null, function () { return _this.parent.hideSpinner(); });
            });
        }
        if (this.initload) {
            this.parent.layoutModule.refresh();
            this.parent.renderTemplates();
        }
        this.initload = true;
    };
    /**
     * The function is used to handle the update the column data count for remote, and update kanbanData while perform the CRUD action
     *
     * @param {ReturnType} args Accepts the dataManager success result
     * @returns {void}
     * @private
     */
    Data.prototype.updateKanbanData = function (args) {
        var resultData = extend([], !isNullOrUndefined(args.result.result) ?
            args.result.result : args.result, null, true);
        if (this.isRemote() && this.parent.enableVirtualization && resultData.length > 0
            && !isNullOrUndefined(args.result.count)) {
            var columnsKeyFields = this.columnKeyFields();
            for (var i = 0; i < columnsKeyFields.length; i++) {
                if (args.result.count[i].Key === columnsKeyFields[i]) {
                    this.parent.columnDataCount[columnsKeyFields[i]] = args.result.count[i].Value;
                }
            }
        }
        this.parent.kanbanData = resultData;
        this.kanbanData = new DataManager(this.parent.kanbanData);
    };
    /**
     * The function is used to handle the failure response from dataManager
     *
     * @param {ReturnType} e Accepts the dataManager failure result
     * @returns {void}
     * @private
     */
    Data.prototype.dataManagerFailure = function (e) {
        var _this = this;
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.trigger(events.actionFailure, { error: e }, function () { return _this.parent.hideSpinner(); });
    };
    /**
     * The function is used to perform the insert, update, delete and batch actions in datamanager
     *
     * @param {string} updateType Accepts the update type action
     * @param {SaveChanges} params Accepts the savechanges params
     * @param {string} type Accepts the requestType as string
     * @param {Object} data Accepts the data to perform crud action
     * @param {number} index Accepts the index to refresh the data into UI
     * @param {boolean} isDropped Accepts the boolean value based on based if it is dragged and dropped
     * @param {string} dataDropIndexKeyFieldValue Accepts the dropped index key field value card
     * @param {number} draggedKey Accepts the dragged keyfield of the column
     * @param {number} droppedKey Accepts the dropped keyfield of the column
     * @param {number} isMultipleDrag Accepts boolean value based on the multiple drag of the cards
     * @returns {void}
     * @private
     */
    Data.prototype.updateDataManager = function (updateType, params, type, data, index, isDropped, dataDropIndexKeyFieldValue, draggedKey, droppedKey, isMultipleDrag) {
        var _this = this;
        this.parent.showSpinner();
        var promise;
        var actionArgs = {
            requestType: type, cancel: false, addedRecords: params.addedRecords,
            changedRecords: params.changedRecords, deletedRecords: params.deletedRecords
        };
        this.setState({ isDataChanged: true });
        this.eventPromise(actionArgs, this.query, index);
        this.parent.trigger(events.actionComplete, actionArgs, function (offlineArgs) {
            if (!offlineArgs.cancel) {
                promise = _this.syncDataSource(_this.dataManager, updateType, params, data, isDropped, dataDropIndexKeyFieldValue);
                if (_this.dataManager.dataSource.offline) {
                    if (!_this.isObservable) {
                        _this.syncDataSource(_this.kanbanData, updateType, params, data, isDropped, dataDropIndexKeyFieldValue);
                        index = draggedKey === droppedKey && isMultipleDrag ? index - 1 : index;
                        _this.refreshUI(offlineArgs, index, isDropped);
                        if (_this.parent.enableVirtualization) {
                            _this.parent.virtualLayoutModule.refreshColumnData(draggedKey, droppedKey, offlineArgs.requestType, data[_this.parent.keyField]);
                        }
                    }
                }
                else {
                    promise.then(function (args) {
                        if (_this.parent.isDestroyed) {
                            return;
                        }
                        var dataManager = _this.getData(_this.getQuery());
                        dataManager.then(function (e) { return _this.dataManagerSuccess(e, 'DataSourceChange', offlineArgs, index); }).catch(function (e) { return _this.dataManagerFailure(e); });
                        if (offlineArgs.requestType === 'cardCreated') {
                            if (!Array.isArray(args)) {
                                offlineArgs.addedRecords[0] = extend(offlineArgs.addedRecords[0], args);
                            }
                            else {
                                _this.modifyArrayData(offlineArgs.addedRecords, args);
                            }
                        }
                        else if (offlineArgs.requestType === 'cardChanged') {
                            if (!Array.isArray(args)) {
                                offlineArgs.changedRecords[0] = extend(offlineArgs.changedRecords[0], args);
                            }
                            else {
                                _this.modifyArrayData(offlineArgs.changedRecords, args);
                            }
                        }
                        else if (offlineArgs.requestType === 'cardRemoved') {
                            if (!Array.isArray(args)) {
                                offlineArgs.deletedRecords[0] = extend(offlineArgs.deletedRecords[0], args);
                            }
                            else {
                                _this.modifyArrayData(offlineArgs.deletedRecords, args);
                            }
                        }
                        index = draggedKey === droppedKey && isMultipleDrag ? index - 1 : index;
                        _this.refreshUI(offlineArgs, index, isDropped);
                        if (_this.parent.enableVirtualization) {
                            _this.parent.virtualLayoutModule.refreshColumnData(draggedKey, droppedKey, offlineArgs.requestType, data[_this.parent.keyField]);
                        }
                    }).catch(function (e) {
                        _this.dataManagerFailure(e);
                    });
                }
            }
        });
    };
    Data.prototype.syncDataSource = function (dataManager, updateType, params, data, isDropped, dataDropIndexKeyFieldValue) {
        var _this = this;
        var promise;
        switch (updateType) {
            case 'insert':
                return dataManager.insert(data, this.getTable(), this.getQuery());
            case 'update':
                if (this.parent.enableVirtualization && !this.parent.dataModule.isRemote() && isDropped) {
                    promise = dataManager.remove(this.keyField, data, this.getTable(), this.getQuery());
                    promise = dataManager.insert(data, this.getTable(), this.getQuery(), dataManager.dataSource.json.findIndex(function (data) {
                        return data[_this.parent.cardSettings.headerField] === dataDropIndexKeyFieldValue;
                    }));
                    return promise;
                }
                else {
                    return dataManager.update(this.keyField, data, this.getTable(), this.getQuery());
                }
            case 'delete':
                return dataManager.remove(this.keyField, data, this.getTable(), this.getQuery());
            case 'batch':
                if (!this.parent.dataModule.isRemote() && isDropped && this.parent.enableVirtualization && data) {
                    for (var i = 0; i < data.length; i++) {
                        promise = dataManager.remove(this.keyField, data[i], this.getTable(), this.getQuery());
                    }
                    var currentIndex = dataManager.dataSource.json.findIndex(function (data) {
                        return data[_this.parent.cardSettings.headerField] === dataDropIndexKeyFieldValue;
                    });
                    for (var i = 0; i < data.length; i++, currentIndex++) {
                        promise = dataManager.insert(data[i], this.getTable(), this.getQuery(), currentIndex);
                    }
                    return promise;
                }
                else {
                    return dataManager.saveChanges(params, this.keyField, this.getTable(), this.getQuery());
                }
            default:
                return promise;
        }
    };
    Data.prototype.modifyArrayData = function (onLineData, e) {
        if (onLineData.length === e.length) {
            for (var i = 0; i < e.length; i++) {
                onLineData[i] = extend(onLineData[i], e[i]);
            }
        }
        return onLineData;
    };
    /**
     * The function is used to refresh the UI once the data manager action is completed
     *
     * @param {ActionEventArgs} args Accepts the ActionEventArgs to refresh UI.
     * @param {number} position Accepts the index to refresh UI.
     * @param {boolean} isDropped Accepts the boolean value based on based if it is dragged and dropped
     * @returns {void}
     */
    Data.prototype.refreshUI = function (args, position, isDropped) {
        var _this = this;
        if (this.parent.enableVirtualization) {
            this.parent.virtualLayoutModule.columnData = this.parent.virtualLayoutModule.getColumnCards();
            args.addedRecords.forEach(function (data, index) {
                _this.parent.virtualLayoutModule.renderCardBasedOnIndex(data, position + index, isDropped, args.requestType);
            });
            args.changedRecords.forEach(function (data) {
                _this.parent.virtualLayoutModule.removeCard(data);
                _this.parent.virtualLayoutModule.renderCardBasedOnIndex(data, position, isDropped, args.requestType);
                if (_this.parent.virtualLayoutModule.isSelectedCard) {
                    _this.parent.actionModule.SingleCardSelection(data);
                }
                if (_this.parent.sortSettings.field && _this.parent.sortSettings.sortBy === 'Index'
                    && _this.parent.sortSettings.direction === 'Descending' && position > 0) {
                    --position;
                }
                else {
                    position++;
                }
            });
            args.deletedRecords.forEach(function (data) {
                _this.parent.virtualLayoutModule.removeCard(data);
            });
            this.parent.virtualLayoutModule.refresh();
        }
        else {
            this.parent.layoutModule.columnData = this.parent.layoutModule.getColumnCards();
            if (this.parent.swimlaneSettings.keyField) {
                this.parent.layoutModule.kanbanRows = this.parent.layoutModule.getRows();
                this.parent.layoutModule.swimlaneData = this.parent.layoutModule.getSwimlaneCards();
            }
            args.addedRecords.forEach(function (data, index) {
                if (_this.parent.swimlaneSettings.keyField && !data[_this.parent.swimlaneSettings.keyField]) {
                    data[_this.parent.swimlaneSettings.keyField] = '';
                }
                _this.parent.layoutModule.renderCardBasedOnIndex(data, position + index);
            });
            args.changedRecords.forEach(function (data) {
                if (_this.parent.swimlaneSettings.keyField && !data[_this.parent.swimlaneSettings.keyField]) {
                    data[_this.parent.swimlaneSettings.keyField] = '';
                }
                _this.parent.layoutModule.removeCard(data);
                _this.parent.layoutModule.renderCardBasedOnIndex(data, position);
                if (_this.parent.layoutModule.isSelectedCard) {
                    _this.parent.actionModule.SingleCardSelection(data);
                }
                if (_this.parent.sortSettings.field && _this.parent.sortSettings.sortBy === 'Index'
                    && _this.parent.sortSettings.direction === 'Descending' && position > 0) {
                    --position;
                }
                else {
                    position++;
                }
            });
            args.deletedRecords.forEach(function (data) {
                _this.parent.layoutModule.removeCard(data);
            });
            this.parent.layoutModule.refresh();
        }
        this.parent.renderTemplates();
        this.parent.notify(events.contentReady, {});
        this.parent.trigger(events.dataBound, args, function () { return _this.parent.hideSpinner(); });
    };
    return Data;
}());
export { Data };
