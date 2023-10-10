import { useEffect, useReducer, useRef, useState } from 'react';
import { DashboardGraphDataEvent } from '../graph-controller';
import { DashboardGraphDataState, DashboardGraphQueryURLAction, GraphOrderState, GraphQueryState, QueryURLState,  DashboardGraphDataReducer as DashboardDataReducerModel, DashboardGraphDataAction } from '../model';
import { Filter, Order, filterEntry, parseSortField, stringify } from '../util';

export function FiniteOnlineQueryURLReducer(
    state: QueryURLState,
    action: DashboardGraphQueryURLAction,
): QueryURLState {

    switch (action.type) {
        case 'SetQueryState': {
            const { payload } = action;
            const {
                baseDataURL = state.baseDataURL,
                ...queryParam
            } = payload;
            const newQueryState: Partial<GraphQueryState & GraphOrderState> = filterEntry(
                state,
                ['filter', 'order', 'txt', 'page', 'pageSize'],
            );
            for (let key in queryParam) {
                switch (key) {
                    case 'txt': {
                        newQueryState.txt = queryParam.txt;
                        break;
                    }
                    case 'order': {
                        const normalizedOrder = stringify(queryParam.order);

                        newQueryState.order = normalizedOrder;
                        newQueryState.orderMap = parseSortField(normalizedOrder);
                        break;
                    }
                    case 'filter': {
                        newQueryState.filter = stringify(queryParam.filter);
                        break;
                    }
                    case 'pageSize': {
                        const pageSize = queryParam.pageSize;
                        if (typeof pageSize === 'number') {
                            newQueryState.pageSize = pageSize;
                        }
                        break;
                    }
                }
            }
            /**
             * Page number được reset nếu các yếu tố khác thay đổi, nhưng nếu
             * page được set trực tiếp thì bỏ qua hành vi này
             */
            const page = queryParam.page;
            if (typeof page === 'number') newQueryState.page = page;

            return {
                ...state,
                ...newQueryState,
                baseDataURL,
                dataURL: '',
                mounted: true,
            };
        }
        case 'SetURL': {
            const { baseDataURL } = action.payload;
            const { filter, order, txt, page, pageSize } = state;
            const newOrderMap = parseSortField(order);

            return {
                ...state,
                orderMap: newOrderMap,
                dataURL: '',
                baseDataURL,
                mounted: true,
            };
        }
        case 'ReplaceOrder': {
            const { field, direction } = action.payload;
            const { baseDataURL, filter, txt, page, pageSize } = state;
            const newOrderMap = { [field]: direction };
            const newOrder = stringify([`${field}.${direction === 'ascending' ? '-1' : '1'}`]);

            return {
                ...state,
                order: newOrder,
                orderMap: newOrderMap,
                dataURL: '',
                mounted: true,
            };
        }
        case 'ResetQuery': {
            const newState = {
                filter: undefined,
                order: undefined,
                txt: undefined,
            };
            const { baseDataURL, page, pageSize } = state;

            return {
                ...state,
                ...newState,
                orderMap: {},
                dataURL: '',
                baseDataURL,
                mounted: true,
            };
        }
        default: throw new Error('Undefined Action');
    }
}

type useDashboardGraphProps<Data extends Record<string, any>> = {
    baseDataURL?: string,

    defaultFilter?: Filter,
    defaultOrder?: Order,
    defaultTxt?: string | null,
    defaultPage?: number,
    defaultPageSize?: number,

    keyExtractor: (data: Data) => string,
} & DashboardGraphDataEvent<Data>;

export type UseDashboardGraphDataState<Data extends Record<string, any>> = DashboardGraphDataState<Data> & QueryURLState;
export const useDashboardGraphData = <Data extends Record<string, any>>(
    {
        baseDataURL = '',

        keyExtractor,
        defaultFilter, onFilterChange = () => {},
        defaultOrder, onOrderChange = () => {},
        defaultTxt, onTxtChange = () => {},
        defaultPage = undefined,
        onPageChange = () => {},
        defaultPageSize = undefined,
        onPageSizeChange = () => {},
        onDataURLChange = () => {},
        onDataReduce = data => data,
        
        onQueryFailure = () => {},
        onQuerySuccess = () => {},
    }: useDashboardGraphProps<Data>,
    dependency?: string,
) => {
    const afterMount = useRef(false);
    const [refreshSignal, setCnt] = useState(0);
    const refresh = () => setCnt(cur => cur + 1);
    const [urlDataBundle, dispatchURLAction] = useReducer(
        FiniteOnlineQueryURLReducer,
        {
            mounted: false,
            dataURL: '',
            baseDataURL,
            filter: undefined,
            order: undefined,
            txt: undefined,
            page: defaultPage,
            pageSize: defaultPageSize,
            orderMap: {},
        },
    );

    const {
        mounted,
        dataURL,
        page, pageSize,
        txt, filter, order,
    } = urlDataBundle; 

    useEffect(() => {
        dispatchURLAction({
            type: 'SetQueryState',
            payload: {
                filter: defaultFilter,
                order: defaultOrder,
                txt: defaultTxt,
                page: defaultPage,
                pageSize: defaultPageSize,
                baseDataURL,
            },
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (afterMount.current) onFilterChange(urlDataBundle.filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlDataBundle.filter]);

    useEffect(() => {
        if (afterMount.current) onOrderChange(urlDataBundle.order);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlDataBundle.order]);

    useEffect(() => {
        if (afterMount.current) onTxtChange(urlDataBundle.txt);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlDataBundle.txt]);

    useEffect(() => {
        if (afterMount.current) onPageChange(urlDataBundle.page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlDataBundle.page]);

    useEffect(() => {
        if (afterMount.current) onPageSizeChange(urlDataBundle.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlDataBundle.pageSize]);

    useEffect(() => {
        onDataURLChange(urlDataBundle?.dataURL ?? '', { page, pageSize, filter, txt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlDataBundle.dataURL]);

    useEffect(() => {
        let relevant = true;
        if (typeof dataURL === 'string' && dataURL.length > 0) {
            (async () => {
                try {
                    // const { data: untransformedData } = await fetch(dataURL);
                    if (relevant) {
                        const dataList = onDataReduce([]);

                        onQuerySuccess(dataList);
                     
                    }
                } catch (e: any) {
                    if (relevant) {
                        onQueryFailure(e);
                       
                    }
                }
            })();
        }

        return () => {
            relevant = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataURL, dependency, refreshSignal]);

    useEffect(() => {
        if (mounted === true) afterMount.current = true;
    }, [mounted]);

    return [
        {
            ...urlDataBundle,
        },
        {
            refresh,
            urlAction: dispatchURLAction,
        },
    ] as [
        UseDashboardGraphDataState<Data>,
        {
            refresh: () => void,
            urlAction: React.Dispatch<DashboardGraphQueryURLAction>,
            dataAction: React.Dispatch<DashboardGraphDataAction<Data>>,
        }
    ];
};

export type {DashboardGraphDataAction} from '../model'
export type { DashboardGraphQueryURLAction } from '../model';