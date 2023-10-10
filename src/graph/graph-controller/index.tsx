import { forwardRef, useImperativeHandle, useState } from "react";
import { BaseDynamicGraphProps, SpeclessBaseGraph } from "../type";
import { Order } from "vega";
import { Filter } from "../util";
import { v4 as uuid } from 'uuid';
import { DashboardGraphDataAction, DashboardGraphDataState, DashboardGraphQueryURLAction, QueryURLState } from "../model";
import {useDashboardGraphData} from '../use-dashboard/use-dashboard-graph-data'

export const defaultKeyExtractor = (data: any) => data?._id;

export type DashboardGraphProps = {
    keyExtractor?: (data: any) => string,
}
export type DashboardGraphDataProps = {
    baseDataURL?: string,

    defaultFilter?: Filter,
    defaultOrder?: Order,
    defaultTxt?: string | null,

    defaultPageSize?: number,
    defaultPage?: number
};


type Omit2<BaseType extends Record<string, any>, Removed extends string> = {
    [P in keyof Omit<BaseType, Removed>]: BaseType[P];
};

export type DashboardGraphQueryState = {
    filter?: Filter,
    order?: Order,
    txt?: string | null,

    pageSize?: number,
    page?: number,
};

export type DashboardGraphDataEvent<Data extends Record<string, any>> = {
    onDataURLChange?: (
        newURL: string,
        queryState: DashboardGraphQueryState,
    ) => void,
    onFilterChange?: (filter?: string) => void,
    onOrderChange?: (order?: string) => void,
    onTxtChange?: (txt?: string | null) => void,

    onPageChange?: (newPage?: number) => void,
    onPageSizeChange?: (newPageSize?: number) => void,

    onDataReduce?: (data: any[]) => Data[],
    onQuerySuccess?: (data: Data[]) => boolean | void,
    onQueryFailure?: (error: any) => boolean | void,
};

export type UncontrolledGraph<
    ChartData extends Record<string, any>,
    DynamicGraphProps extends BaseDynamicGraphProps = BaseDynamicGraphProps
> = Omit2<SpeclessBaseGraph<ChartData[], DynamicGraphProps>, 'loading' | 'idling' | 'data' | 'error'>
& DashboardGraphProps
& DashboardGraphDataProps
& DashboardGraphDataEvent<ChartData>;

export type UseDashboardGraphDataState<Data extends Record<string, any>> = DashboardGraphDataState<Data> & QueryURLState;

export type DashboardGraphRef<Data extends Record<string, any>> = {
    uniqueId: string,
    state: UseDashboardGraphDataState<Data>,
    refresh: () => void,
    urlDispatcher: React.Dispatch<DashboardGraphQueryURLAction>,
    dataDispatcher: React.Dispatch<DashboardGraphDataAction<Data>>,
};

export const createUncontrolledGraph = <
    ChartData extends Record<string, any>,
    DynamicGraphProps extends BaseDynamicGraphProps = BaseDynamicGraphProps,
>(
    SeedGraph: React.ComponentType<SpeclessBaseGraph<ChartData[], DynamicGraphProps>>,
) => {
    return forwardRef((
        {
            defaultFilter, onFilterChange,
            defaultOrder, onOrderChange,
            defaultPage, onPageChange,
            defaultPageSize, onPageSizeChange,
            defaultTxt, onTxtChange,
            baseDataURL, onDataURLChange,
            keyExtractor = defaultKeyExtractor,
            onQuerySuccess, onQueryFailure,
            onDataReduce,
            ...graphProps
        }: UncontrolledGraph<ChartData, DynamicGraphProps>,
        ref: React.ForwardedRef<DashboardGraphRef<ChartData>>,
    ) => {
        const [uniqueId] = useState(`dashboard-${uuid()}`);
        const [dashboardData, dashboardDispatcher] = useDashboardGraphData<ChartData>({
            baseDataURL, onDataURLChange,
            defaultFilter, onFilterChange,
            defaultOrder, onOrderChange,
            defaultPage, onPageChange,
            defaultPageSize, onPageSizeChange,
            defaultTxt, onTxtChange,
            onQuerySuccess, onQueryFailure,
            keyExtractor,
            onDataReduce,
        });
    
        useImperativeHandle(ref, () => ({
            dataDispatcher: dashboardDispatcher.dataAction,
            state: dashboardData,
            refresh: dashboardDispatcher.refresh,
            uniqueId,
            urlDispatcher: dashboardDispatcher.urlAction,
        }));
    
        
        return <SeedGraph
            {...graphProps as SpeclessBaseGraph<ChartData[], DynamicGraphProps>}
            idling={dashboardData.idling}
            loading={dashboardData.loading}
            data={dashboardData.dataList}
            error={dashboardData.error}
        />;
    });
};