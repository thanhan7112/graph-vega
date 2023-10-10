import { Filter, Order, SortDirection } from "../util";

export type ColorSchema = {
    /** @todo Chuyển name thành required field */
    name?: string,
    setClass: string,
    main: string,
    sub: string,
    contrast: string,
    mainExplicit: string,
    subExplicit: string,
    contrastExplicit: string,
};

export type DashboardGraphDataState<Data extends Record<string, any>> = {
    keyExtractor: (data: Data) => string,
    idling: boolean,
    loading: boolean,
    dataKeyList: string[],
    dataList: Data[],
    error?: any,
    queryCount: number,
    successCount: number,
    failureCount: number,
};
export type DashboardGraphDataAction<Data extends Record<string, any>> = { type: 'SetLoading', payload: boolean }
| { type: 'SetIdling', payload: boolean }
| { type: 'SetError', payload: any }
| { type: 'SetData', payload?: {
    dataList?: Data[],
}}
| { type: 'SetBundle', payload: Partial<DashboardGraphDataState<Data>> }
export type DashboardGraphDataReducer<Data extends Record<string, any>> = (
    state: DashboardGraphDataState<Data>,
    action: DashboardGraphDataAction<Data>,
) => DashboardGraphDataState<Data>;

export type GraphQueryState = {
    filter?: string,
    order?: string,
    txt?: string | null,
    page?: number,
    pageSize?: number,
};

export type GraphOrderState = {
    orderMap: Record<string, SortDirection>,
}


export type QueryURLState = {
    mounted: boolean,
    dataURL: string,
    baseDataURL: string,
} & GraphOrderState & GraphQueryState;
export type DashboardGraphQueryURLAction = { type: 'SetQueryState', payload: {
    filter?: Filter,
    order?: Order,
    txt?: string | null,
    page?: number,
    pageSize?: number,
    baseDataURL?: string,
}}
| { type: 'ReplaceOrder', payload: { field: string, direction: SortDirection } }
| { type: 'SetURL', payload: { baseDataURL: string } }
| { type: 'ResetQuery' };