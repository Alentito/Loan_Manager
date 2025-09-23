import { DataManager, Query } from '@syncfusion/ej2-data';
import { Kanban } from './kanban';
import { ActionEventArgs, SaveChanges, PendingState } from './interface';
/**
 * Kanban data module
 */
export declare class Data {
    private parent;
    private kanbanData;
    dataManager: DataManager;
    private query;
    private keyField;
    private isObservable;
    private initload;
    protected dataState: PendingState;
    /**
     * Constructor for data module
     *
     * @param {Kanban} parent Accepts the instance of the Kanban
     */
    constructor(parent: Kanban);
    /**
     * The function used to initialize dataManager` and query
     *
     * @param {Object[] | DataManager} dataSource Accepts the dataSource as collection of objects or Datamanager instance.
     * @param {Query} query Accepts the query to process the data from collections.
     * @returns {void}
     * @private
     */
    private initDataManager;
    /**
     * @returns {boolean} returns whether its remote data
     * @hidden
     */
    isRemote(): boolean;
    /**
     * @returns {boolean} returns the column key fields
     * @hidden
     */
    private columnKeyFields;
    /**
     * The function used to generate updated Query from schedule model
     *
     * @param {string} parameter Accepts the parameter that needs to be sent to the service end.
     * @returns {void}
     * @private
     */
    getQuery(parameter?: string): Query;
    /**
     * The function used to get dataSource by executing given Query
     *
     * @param  {Query} query - A Query that specifies to generate dataSource
     * @returns {void}
     * @private
     */
    private getData;
    setState(state: PendingState): Object;
    private getStateEventArgument;
    private eventPromise;
    /**
     * The function used to get the table name from the given Query
     *
     * @returns {string} Returns the table name.
     * @private
     */
    private getTable;
    /**
     * The function is used to send the request and get response from datamanager
     *
     * @returns {void}
     * @private
     */
    private refreshDataManager;
    /**
     * The function is used to handle the success response from dataManager
     *
     * @param {ReturnType} e Accepts the dataManager success result
     * @param type
     * @returns {void}
     * @private
     */
    private dataManagerSuccess;
    /**
     * The function is used to handle the update the column data count for remote, and update kanbanData while perform the CRUD action
     *
     * @param {ReturnType} args Accepts the dataManager success result
     * @returns {void}
     * @private
     */
    private updateKanbanData;
    /**
     * The function is used to handle the failure response from dataManager
     *
     * @param {ReturnType} e Accepts the dataManager failure result
     * @returns {void}
     * @private
     */
    private dataManagerFailure;
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
    updateDataManager(updateType: string, params: SaveChanges, type: string, data: Record<string, any>, index?: number, isDropped?: boolean, dataDropIndexKeyFieldValue?: string, draggedKey?: string, droppedKey?: string, isMultipleDrag?: boolean): void;
    private syncDataSource;
    private modifyArrayData;
    /**
     * The function is used to refresh the UI once the data manager action is completed
     *
     * @param {ActionEventArgs} args Accepts the ActionEventArgs to refresh UI.
     * @param {number} position Accepts the index to refresh UI.
     * @param {boolean} isDropped Accepts the boolean value based on based if it is dragged and dropped
     * @returns {void}
     */
    refreshUI(args: ActionEventArgs, position: number, isDropped?: boolean): void;
}
