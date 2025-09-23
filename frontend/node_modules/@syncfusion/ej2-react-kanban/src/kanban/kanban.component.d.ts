import * as React from 'react';
import { Kanban, KanbanModel } from '@syncfusion/ej2-kanban';
import { DefaultHtmlAttributes } from '@syncfusion/ej2-react-base';
export interface KanbanTypecast {
    tooltipTemplate?: string | Function | any;
    columns?: any;
    swimlaneSettings?: any;
    cardSettings?: any;
    dialogSettings?: any;
}
/**
 * `KanbanComponent` represents the react Kanban.
 * ```tsx
 * <KanbanComponent/>
 * ```
 */
export declare class KanbanComponent extends Kanban {
    state: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<KanbanModel | DefaultHtmlAttributes | KanbanTypecast>;
    setState: any;
    private getDefaultAttributes;
    initRenderCalled: boolean;
    private checkInjectedModules;
    directivekeys: {
        [key: string]: Object;
    };
    private statelessTemplateProps;
    private templateProps;
    private immediateRender;
    private isReactMock;
    props: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<KanbanModel | DefaultHtmlAttributes | KanbanTypecast>;
    forceUpdate: (callBack?: () => any) => void;
    context: Object;
    portals: any;
    isReactComponent: Object;
    refs: {
        [key: string]: React.ReactInstance;
    };
    constructor(props: any);
    render(): any;
}
