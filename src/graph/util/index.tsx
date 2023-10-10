import { mergeDeepWith } from 'ramda';
import { ColorSchema } from '../model';
import { List, isImmutable } from 'immutable';

export type Filter = string | List<Record<string, any>>;
export type Order = string | List<string>;
export type SortDirection = 'ascending' | 'descending';

export function mergeWithDefault<D = Record<string, any>>(defaultObject: Partial<D> = {}, object: Partial<D> = {}): D {
    const mergeCriteria = (left: any, right: any) => right === undefined || right === null ? left : right;

    return mergeDeepWith(mergeCriteria, defaultObject, object);
};

export const clamp = (min: number, cur: number, max: number) => {
    return cur <= min ? min : cur >= max ? max : cur;
};

export function mergeClass(...args: (string | undefined | null)[]) {
    return args.filter(Boolean).join(' ');
}

export const colorSchemaToGraphColorSchema = <Schema extends Record<string, ColorSchema>>(schema: Schema) => {
    const bgColorSchema: string[] = [];
    const txtColorSchema: string[] = [];
    const domainSchema: string[] = [];

    Object
        .entries(schema)
        .forEach(([key, value]) => {
            bgColorSchema.push(value.mainExplicit ?? '#fff');
            txtColorSchema.push(value.contrastExplicit ?? '#000');
            domainSchema.push(key);
        });
    return {
        bgColorSchema,
        txtColorSchema,
        domainSchema,
    };
};

export const filterEntry = (obj: Record<string, any>, keyList: string[]) => {
    if (obj === undefined || obj === null) return {};
    const retObj: Record<string, any> = {};
    keyList.forEach(key => {
        retObj[key] = obj[key];
    });
    return retObj;
};


export const countBy = <Data extends Record<string, any> = {}>(data: Data[], key: keyof Data) => {
    return (data ?? []).reduce(function(prev, curr) {
        const groupingValue = curr[key];
        if (prev[groupingValue] === undefined) prev[groupingValue] = 0;
        prev[groupingValue] += 1;
        return prev;
    }, {} as Record<string, number>);
};

const calculateLabelAngle = (domainLength: number, width: number) => {
    const domainTickSize = width / domainLength;
    return domainLength === -1
        ? -35
        : Math.round(clamp(
            -35,
            -1 * Math.acos(clamp(1, domainTickSize, 90) / 90) * 180 / (Math.PI),
            0));
};
const calculateFontSize = (domainLength: number, width: number) => {
    if (domainLength === -1) return 10;
    return clamp(
        11,
        Math.round(width / domainLength * 0.125),
        15,
    );
};

const calculateMarkFontSize = (domainLength: number, width: number) => {
    if (domainLength === -1) return 10;
    return clamp(
        11,
        Math.round(width / domainLength * 0.125),
        15,
    );
};

export const withDynamicSize = (data: any[], width: number, fastRender = false, countKey = 'period') => {
    const domainLength = fastRender ? -1 : Object.keys(countBy(data, countKey)).length;
    return {
        labelAngle: calculateLabelAngle(domainLength, width),
        fontSize: calculateFontSize(domainLength, width),
        labelLimit: domainLength > 0
            ? 0.85 * width / domainLength // Tỷ lệ ước chừng của đồ thị ngang sau khi trừ đi trục tung
            : 100,
        markFontSize: calculateMarkFontSize(domainLength, width),
    };
};


export const stringify = (data: any) => {
    if (typeof data === 'string') return data;
    if (isImmutable(data)) return JSON.stringify(data.toJSON());
    return JSON.stringify(data);
};

export const parseSortField = (sortValue?: string):Record<string, SortDirection> => {
    if (typeof sortValue !== 'string') return {};
    try {
        const orderMap: Record<string, SortDirection> = {};
        (JSON.parse(sortValue) as string[])
            .forEach(entry => {
                const [field, direction] = entry.split('.');

                orderMap[field] = parseInt(direction) < 0 ? 'ascending' : 'descending';
            });

        return orderMap;
    } catch (e) {
        return {};
    }
};