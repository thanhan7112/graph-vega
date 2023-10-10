import { VisualizationSpec } from "react-vega";
import { Axis, Spec, Title } from "vega";
import { HangingTitle } from "../hanging-title";


export type AutoDimensionCalculator = (data: any[], autoWidth: number, autoHeight: number) => (number | 'auto');
export type DimensionCalculator = (data: any[], autoWidth: number, autoHeight: number) => number;

export type GraphBuilder<
    T = Record<string, any>,
    DynamicGraphProps extends DynamicColorFieldMap = { dataScaleMap: {} },
> = {
    size: {
        width: number,
        height: number,
    },
    fastRender?: boolean,
    padding?: boolean,
    title?: Title,
}
& DynamicGraphProps
& Pick<SpeclessGraph<T>, 'data' | 'font'>;

export type SpecGenerator<
    T = Record<string, any>,
    DynamicGraphProps extends DynamicColorFieldMap = { dataScaleMap: {} },
> = (
    props: GraphBuilder<T, DynamicGraphProps>,
) => Spec;

export const getDefaultSize = (containerSize?: {
    height?: any,
    width?: any,
    minHeight?: any,
    maxHeight?: any,
    maxWidth?: any,
    minWidth?: any,
    heightByDataRatio?: any,
    widthByDataRatio?: any,
}) => {
    return {
        height: (() => 'auto') as AutoDimensionCalculator,
        width: (() => 'auto') as AutoDimensionCalculator,
        minHeight: (() => 0) as DimensionCalculator,
        maxHeight: (containerSize?.heightByDataRatio || containerSize?.height)
            ? (() => 10000) as DimensionCalculator
            : (() => 400) as DimensionCalculator,
        maxWidth: (containerSize?.width)
            ? (() => 10000) as DimensionCalculator
            : (() => 2000) as DimensionCalculator,
        minWidth: (() => 0) as DimensionCalculator,
        heightByDataRatio: null as number | null,
        widthByDataRatio: null as number | null,
        maxConfinedHeight: null as DimensionCalculator | null,
    };
};

export type GraphSize = Partial<ReturnType<typeof getDefaultSize>>;

export const defaultLang = {
    xAxisName: undefined as string | undefined,
    yAxisName: undefined as string | undefined,
    legend: 'Legend' as string | undefined,
};

export type SignalListener = (name: string, value: any) => void;
type DynamicSignalListener = { signalListener?: Record<string, SignalListener | undefined> };
type DynamicColorFieldMap = { dataScaleMap?: Record<string, string> };
type DynamicAxes = { axes?: Record<string, Partial<Axis>> };
type DynamicLang = { lang?: Partial<typeof defaultLang> };
export type BaseDynamicGraphProps = DynamicSignalListener
& DynamicColorFieldMap
& DynamicAxes
& DynamicLang;

export type SpeclessGraph<T = Record<string, any>[]> = {
    data: T,
    containerSize?: GraphSize,
    font?: string,
};

export const GRAPH_INNER_TEXT_COLOR = '#787885';
export const GRAPH_OUTER_TEXT_COLOR = '#232334';
export const GRAPH_OUTER_TEXT_SUB_COLOR = '#343456';
export const GRAPH_LABEL_LIMIT = 200;

export type CurveInterpolateType = 'basis' |
'cardinal' |
'catmull-rom' |
'linear' |
'monotone' |
'natural' |
'step' |
'step-after' |
'step-before';

export type GraphTextBuilder<
    Data extends Record<string, any> = {},
    CustomizeProps extends Record<string, any> = {}
> = Partial<Record<keyof Required<Data>, string | ((props: CustomizeProps) => string)>>;

export type SpeclessBaseGraph<
    T = Record<string, any>,
    DynamicGraphProps extends BaseDynamicGraphProps = BaseDynamicGraphProps,
> = SpeclessGraph<T>
& {
    name?: string,
    debug?: boolean,
    title?: string | Title,
    idling?: boolean,
    loading?: boolean,
    fallback?: React.ReactChild,
    suspenseFallback?: React.ReactChild,
    /**
     * @deprecated Thay thế dần ra khỏi đồ thị
     */
    spec?: VisualizationSpec | SpecGenerator<T, DynamicGraphProps>,
    specTransform?: (spec: Spec) => Spec,
    /**
     * @todo Chuyển dần đồ thị sang dạng tự động padding thay vì lệ thuộc padding bên ngoài
     */
    confined?: boolean,
    error?: any,
    legendOption?: {
        atBottom?: boolean,
        columnWidth?: number,
    },
}
& DynamicGraphProps
& HangingTitle;