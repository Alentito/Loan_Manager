import { Kanban } from '../base/kanban';
import { HeaderArgs, VirtualScrollInfo } from '../base/interface';
import { ColumnsModel } from '../models/index';
import { MobileLayout } from './mobile-layout';
/**
 * Kanban layout rendering module
 *
 */
export declare class VirtualLayoutRender extends MobileLayout {
    parent: Kanban;
    kanbanRows: HeaderArgs[];
    columnKeys: string[];
    scrollLeft: number;
    columnData: {
        [key: string]: any[];
    };
    frozenSwimlaneRow: HTMLElement;
    frozenOrder: number;
    isSelectedCard: boolean;
    currentStatus: VirtualScrollInfo;
    scrollStatus: {
        [key: string]: VirtualScrollInfo;
    };
    private offsets;
    private tempOffsets;
    private offsetKeys;
    private query;
    private isSwimlane;
    private singleIndexSwimlaneCardCount;
    private cardHeight;
    private winResize;
    constructor(parent: Kanban);
    private initRender;
    private cardHeightCalculate;
    private renderHeader;
    private renderContent;
    private renderSingleContent;
    private windowResize;
    refreshColumnData(draggedColumnKey: string, droppedColumnKey: string, requestType?: string, crudKeyField?: string): void;
    private renderCards;
    private renderCard;
    private renderEmptyCard;
    private renderColGroup;
    private getRows;
    private createStackedRow;
    private scrollUiUpdate;
    private onContentScroll;
    private getOffset;
    private getTranslateY;
    private setPadding;
    private getData;
    private eventPromise;
    private getStateEventArgument;
    private dataManagerSuccess;
    private dataManagerFailure;
    private onColScrollShowSkeleton;
    private showSkeleton;
    private hideSkeleton;
    private onColumnScroll;
    private checkScrollDirection;
    private findScrollSpeed;
    private removeCardsOnScroll;
    private scrollCardInsert;
    ensureColumnNotEmpty(draggedColumnKey: string): void;
    private triggerCardRendering;
    private ensureBlocks;
    private getInfoFromView;
    private getBlockIndexes;
    private getPageFromTop;
    private getPage;
    private onAdaptiveScroll;
    /**
     * Check column is visible or not.
     *
     * @param {ColumnsModel} column - specifies the column.
     * @returns {boolean} - Check column is visible or not.
     * @private
     * @hidden
     */
    isColumnVisible(column: ColumnsModel): boolean;
    private renderLimits;
    private renderValidation;
    private getValidationClass;
    private refreshValidation;
    getColumnData(columnValue: string | number, dataSource?: Record<string, any>[]): Record<string, any>[];
    private sortCategory;
    sortOrder(key: string, direction: string, cardData: Record<string, any>[]): Record<string, any>[];
    private documentClick;
    disableAttributeSelection(cards: HTMLElement[] | Element): void;
    getColumnCards(data?: Record<string, any>[]): Record<string, any[]>;
    refreshHeaders(): void;
    refreshCards(): void;
    refresh(): void;
    updateScrollPosition(): void;
    renderCardBasedOnIndex(data: Record<string, any>, index?: number, isDropped?: boolean, requestType?: string): void;
    removeCard(data: Record<string, any>): void;
    wireEvents(): void;
    unWireEvents(): void;
    wireDragEvent(): void;
    unWireDragEvent(): void;
    destroy(): void;
}
