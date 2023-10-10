import { Axis, SortOrder } from "vega";
import { BarLineChartData } from "./model";
import { CurveInterpolateType, GRAPH_INNER_TEXT_COLOR, GRAPH_LABEL_LIMIT, GraphTextBuilder, SpecGenerator } from "../type";
import { DefaultGraphColorSchema } from "../theme-default";
import { defaultAxis, defaultFont, defaultLegendSchema } from "../base-graph/graph-const";
import { mergeWithDefault, withDynamicSize } from "../util";

export type BarLineChartSpecificProps = {
    tooltipLabel?: GraphTextBuilder<BarLineChartData>,
    tooltipValue?: GraphTextBuilder<BarLineChartData>,
    periodAsDate?: boolean,
    truncate?: boolean,
    interpolation?: CurveInterpolateType,
    axes?: {
        xAxis?: Partial<Axis>,
        yAxis?: Partial<Axis>,
        y2Axis?: Partial<Axis>,
    },
    graphSort?: [SortOrder, SortOrder, SortOrder],
    /** @todo Support multiple line? */
    colorScheme?: {
        bar: keyof typeof DefaultGraphColorSchema,
        line: keyof typeof DefaultGraphColorSchema,
    },
    dataScaleMap?: {
        typeColor?: string,
        legendLabel?: string,
        secondaryLegendLabel?: string,
        order?: string,
    },
    signalListener?: {
        barClick?: (name: string, data: BarLineChartData) => void,
        lineClick?: (name: string, data: BarLineChartData) => void,
        legendClick?: (name: string, data: any) => void,
    },
    lang?: {
        legend?: string,
        xAxisName?: string,
        yAxisName?: string,
        y2AxisName?: string,
    },
}

const PostFillColorMap: Record<string, string> = {};

export const withPostFillColor = (data: Record<string, any>[], dataField: string, colorField?: string) => {
    if (!colorField) return data;
    const colorList = [
        '#222222',
        '#282828',
        '#333333',
        '#383838',
        '#444444',
        '#484848',
        '#555555',
        '#585858',
    ];
    let currentColorListIndex = 0;
    const defaultColor = '#000000';

    return data.map(entry => {
        if (entry?.[colorField] != null) return entry;
        const key = entry?.[dataField];
        let postFillColor = defaultColor;
        if (typeof key === 'string') {
            if (!PostFillColorMap[key]) {
                PostFillColorMap[key] = colorList[currentColorListIndex];
                currentColorListIndex = (currentColorListIndex + 1) % colorList.length;
            }
            postFillColor = PostFillColorMap[key];
        }
        return {
            ...entry,
            [colorField]: postFillColor,
        };
    });
};

export const withCustomizableTooltip = <Data extends Record<string, any> = {}, Props extends Record<string, any> = {}>(
    tooltipLabel: { default: GraphTextBuilder<Data, Props>, customize?: GraphTextBuilder<Data, Props> },
    tooltipValue: { default: GraphTextBuilder<Data, Props>, customize?: GraphTextBuilder<Data, Props> },
    customizeProps: Props,
) => {
    const combinedTooltipLabelMap = mergeWithDefault(
        tooltipLabel.default,
        tooltipLabel.customize,
    );
    const combinedTooltipValueMap = mergeWithDefault(
        tooltipValue.default,
        tooltipValue.customize,
    );

    return (fieldNameList: (keyof Data)[]) => {
        const serializedTooltipFieldList = fieldNameList
            .map(fieldName => {
                const labelBuilder = combinedTooltipLabelMap[fieldName];
                const valueBuilder = combinedTooltipValueMap[fieldName];
                const label = typeof labelBuilder === 'string' ? labelBuilder : labelBuilder(customizeProps);
                const value = typeof valueBuilder === 'string' ? valueBuilder : valueBuilder(customizeProps);

                return `"${label}": ${value}`;
            });

        return `{ ${serializedTooltipFieldList.join(',')} }`;
    };
};

export const populate = (key: string | string[], value: any | any[]) => {
    const keyList = Array.isArray(key) ? key : [key];
    const valueList = Array.isArray(value) ? value : [value];
    const obj = keyList.reduce<Record<string, any>>((prev, curr, index) => {
        const currValue = valueList[index];
        if (currValue !== null && currValue !== undefined) prev[curr] = valueList[index];

        return prev;
    }, {});

    return obj;
};

export const SIGNAL_NAME_FONT_SIZE = 'signalVar_fontSize';
export const getGenericFontSizeSignal = (formula: string) => {
    const minSize = 10;
    const maxSize = 16;
    return {
        name: SIGNAL_NAME_FONT_SIZE,
        value: maxSize,
        update: `clamp(${formula}, ${minSize}, ${maxSize})`,
    };
};

export const BarLineChartSchema: SpecGenerator<BarLineChartData[], BarLineChartSpecificProps> = ({
    data,
    title,
    lang,
    graphSort = ['ascending', 'ascending', 'ascending'],
    size: { width },
    tooltipLabel,
    tooltipValue,
    fastRender = false,
    colorScheme,
    axes,
    font = defaultFont,
    truncate = true,
    interpolation = 'monotone',
    periodAsDate = true,
    dataScaleMap,
}) => {
    const {
        xAxis,
        yAxis,
        y2Axis,
    } = axes ?? {};
    const {
        legend,
        xAxisName,
        yAxisName,
        y2AxisName,
    } = lang ?? {};
    const {
        bar: colorSchemeBar = DefaultGraphColorSchema.default.name,
        line: colorSchemeLine = DefaultGraphColorSchema.paletteOrange.name,
    } = colorScheme ?? {};
    const {
        fontSize,
    } = withDynamicSize(data, width, fastRender);
    const {
        secondaryLegendLabel: secondaryLegendLabelField,
        legendLabel: legendLabelField,
        typeColor: typeColorField,
        order: orderField,
    } = dataScaleMap ?? {};
    const isCustomizeLegendLabel = typeof legendLabelField === 'string';
    const isCustomizedSecondaryLegendlabel = typeof secondaryLegendLabelField === 'string';
    const postFilledData = withPostFillColor(data, 'type', typeColorField);
    const createTooltip = withCustomizableTooltip(
        {
            default: {
                amount: 'Amount',
                secondaryAmount: 'Secondary Amount',
                type: 'Type',
                secondaryType: 'Secondary Type',
                period: 'On',
            },
            customize: tooltipLabel,
        },
        {
            default: {
                amount: 'format(datum["amount"], ",")',
                secondaryAmount: 'format(datum["secondaryAmount"], ",")',
                period: ({ periodAsDate }) => periodAsDate
                    ? 'timeFormat(datum["period"], "%b %d, %Y")'
                    : 'datum["period"]',
                type: ({ isCustomizeLegendLabel }) => isCustomizeLegendLabel
                    ? 'scale("scale_legendForBar", datum["type"])'
                    : 'datum["type"]',
                secondaryType: ({ isCustomizedSecondaryLegendlabel }) => isCustomizedSecondaryLegendlabel
                    ? 'scale("scale_legendForPoint", datum["secondaryType"])'
                    : 'datum["secondaryType"]',
            },
            customize: tooltipValue,
        },
        {
            periodAsDate,
            isCustomizeLegendLabel,
            isCustomizedSecondaryLegendlabel,
        },
    );

    return {
        ...populate('title', title),
        autosize: 'fit',
        data: [
            {
                name: 'dataProcessed',
                values: postFilledData,
                format: { parse: { period: periodAsDate ? 'date' : 'string' } },
                transform: [
                    {
                        type: 'collect',
                        sort: {
                            field: [orderField ?? 'period', 'type', 'secondaryType'],
                            order: graphSort,
                        },
                    },
                ],
            },
        ],
        signals: [
            {
                name: 'signal_currentHoverRect',
                value: {},
                on: [
                    { events: 'rect:mouseover', update: 'datum' },
                    { events: 'rect:mouseout', update: '{}' },
                ],
            },
            {
                name: 'signal_currentHoverSymbol',
                value: {},
                on: [
                    { events: 'symbol:mouseover', update: 'datum' },
                    { events: 'symbol:mouseout', update: '{}' },
                ],
            },
            {
                name: 'interpolateTypeSignal',
                value: `${interpolation}`,
            },
            /**
             * Tham số lệ thuộc: Độ dài tổng => Chia cho mỗi vùng => Chia cho số bar trong một vùng => Chia cho số ký tự dài nhất có thể xuất hiện trong một bar
             * 
             * Font size cho số liệu trên đầu của mỗi bar.
             * * 0.01 là tham số phụ để ngăn xảy ra trường hợp chia cho 0.
             * * 0.6 là tỷ lệ tương đối giữa độ dài chữ và font size.
             * * 0.85 là tỷ lệ tương đối giữa chữ và độ dài của bar (ta muốn chữ hơi nhỏ một chút chứ không dính sát vào bar)
             */
            getGenericFontSizeSignal(`width
                / (domain("scale_periodForBar").length + 0.01)
                / (domain("scale_colorForBar").length + 0.01)
                / (toString(domain("scale_amountForBar")[1]).length + 0.01)
                / 0.6 * 0.85`),
            {
                name: 'barClick',
                value: null,
                on: [
                    {
                        events: '@markGroupBar_bar:click',
                        update: '{ value: datum }',
                        force: true,
                    },
                ],
            },
            {
                name: 'lineClick',
                value: null,
                on: [
                    {
                        events: '@pointMark:click',
                        update: '{ value: datum }',
                        force: true,
                    },
                ],
            },
            {
                name: 'legendClick',
                value: null,
                on: [
                    {
                        events: '@legendSymbol:click, @legendLabel:click',
                        update: '{ value: datum }',
                        force: true,
                    },
                ],
            },
        ],
        scales: [
            {
                name: 'scale_periodForBar',
                type: 'band',
                range: 'width',
                domain: { data: 'dataProcessed', field: 'period' },
                padding: 0.2,
            },
            {
                name: 'scale_periodForPoint',
                type: 'point',
                range: 'width',
                domain: { data: 'dataProcessed', field: 'period' },
            },
            {
                name: 'scale_amountForBar',
                type: 'linear',
                range: 'height',
                nice: true,
                zero: true,
                domain: { data: 'dataProcessed', field: 'amount' },
            },
            {
                name: 'scale_amountForPoint',
                type: 'linear',
                range: 'height',
                nice: true,
                zero: true,
                domain: { data: 'dataProcessed', field: 'secondaryAmount' },
            },
            {
                name: 'scale_colorForBar',
                type: 'ordinal',
                range: typeColorField
                    ? { data: 'dataProcessed', field: typeColorField }
                    : { scheme: colorSchemeBar },
                domain: { data: 'dataProcessed', field: 'type' },
            },
            {
                name: 'scale_colorForPoint',
                type: 'ordinal',
                range: { scheme: colorSchemeLine },
                domain: { data: 'dataProcessed', field: 'secondaryType' },
            },
            {
                name: 'scale_legendForBar',
                type: 'ordinal',
                range: legendLabelField
                    ? { data: 'dataProcessed', field: legendLabelField }
                    : { data: 'dataProcessed', field: 'type' },
                domain: { data: 'dataProcessed', field: 'type' },
            },
            {
                name: 'scale_legendForPoint',
                type: 'ordinal',
                range: { data: 'dataProcessed', field: 'secondaryType' },
                domain: { data: 'dataProcessed', field: 'secondaryType' },
            },
        ],
        axes: [
            {
                ...defaultAxis(font, fontSize),
                orient: 'left',
                scale: 'scale_amountForBar',
                maxExtent: 55,
                minExtent: 55,
                tickMinStep: 1,
                ...yAxis,
                ...populate('title', yAxisName),
            },
            {
                ...defaultAxis(font, fontSize),
                orient: 'right',
                scale: 'scale_amountForPoint',
                maxExtent: 65,
                minExtent: 65,
                tickMinStep: 1,
                grid: false,
                ...y2Axis,
                ...populate('title', y2AxisName),
            },
            {
                ...defaultAxis(font, fontSize),
                ...(periodAsDate
                    ? {
                        format: '%b %d %Y',
                        formatType: 'time',
                    }
                    : {}),
                grid: false,
                labelAlign: 'center',
                labelFontSize: fontSize,
                labelPadding: 15,
                labelLimit: truncate
                    ? { signal: 'width / (domain("scale_periodForBar").length + 0.01) * 0.9' }
                    : GRAPH_LABEL_LIMIT,
                labelOverlap: truncate ? false : 'parity',
                orient: 'bottom',
                scale: 'scale_periodForBar',
                ...xAxis,
                ...populate('title', xAxisName),
            },
        ],
        marks: [
            {
                type: 'group',
                name: 'markGroupBar',
                from: {
                    facet: {
                        name: 'markGroupDataBar',
                        data: 'dataProcessed',
                        groupby: 'period',
                    },
                },
                encode: {
                    enter: {
                        x: { scale: 'scale_periodForBar', field: 'period' },
                    },
                },
                signals: [
                    { name: 'width', update: 'bandwidth("scale_periodForBar")' },
                ],
                scales: [
                    {
                        name: 'barGroupScale',
                        type: 'band',
                        range: 'width',
                        domain: { data: 'markGroupDataBar', field: 'type' },
                    },
                ],
                marks: [
                    {
                        name: 'markGroupBar_topText',
                        type: 'text',
                        from: { data: 'markGroupDataBar' },
                        encode: {
                            enter: {
                                fill: { value: GRAPH_INNER_TEXT_COLOR },
                                font: { value: font },
                                fontSize: { signal: SIGNAL_NAME_FONT_SIZE },
                                fontWeight: { value: 'bold' },
                                fillOpacity: { value: 1 },
                                zindex: { value: 101 },
                            },
                            update: {
                                x: {
                                    scale: 'barGroupScale',
                                    field: 'type',
                                    offset: { signal: 'bandwidth("barGroupScale") / 2' },
                                },
                                y: { scale: 'scale_amountForBar', field: 'amount', offset: -5 },
                                text: { field: 'amount' },
                                align: { value: 'center' },
                                fillOpacity: {
                                    signal: 'datum["amount"] > 0 ? 1 : 0',
                                },
                            },
                        },
                    },
                    {
                        name: 'markGroupBar_bar',
                        from: { data: 'markGroupDataBar' },
                        type: 'rect',
                        encode: {
                            enter: {
                                x: { scale: 'barGroupScale', field: 'type' },
                                width: { scale: 'barGroupScale', band: 1 },
                                y: { scale: 'scale_amountForBar', field: 'amount' },
                                y2: { scale: 'scale_amountForBar', value: 0 },
                                fill: { scale: 'scale_colorForBar', field: 'type' },
                                tooltip: {
                                    signal: createTooltip([
                                        'type',
                                        'amount',
                                        'period',
                                    ]),
                                },
                            },
                            update: {
                                fillOpacity: {
                                    signal: '(datum.period === signal_currentHoverRect.period && datum.type === signal_currentHoverRect.type) ? 0.75 : 1',
                                },
                            },
                        },
                    },
                ],
            },
            {
                type: 'group',
                name: 'markLine',
                from: {
                    facet: {
                        name: 'dataProcessedAsLine',
                        data: 'dataProcessed',
                        groupby: 'type',
                    },
                },
                marks: [
                    {
                        type: 'line',
                        name: 'lineMark',
                        from: { data: 'dataProcessedAsLine' },
                        encode: {
                            enter: {
                                x: {
                                    scale: 'scale_periodForBar',
                                    field: 'period',
                                    offset: { signal: 'bandwidth("scale_periodForBar") / 2' },
                                },
                                y: { scale: 'scale_amountForPoint', field: 'secondaryAmount' },
                                stroke: { scale: 'scale_colorForPoint', field: 'secondaryType' },
                                strokeWidth: { value: 2 },
                            },
                            update: {
                                interpolate: { signal: 'interpolateTypeSignal' },
                                strokeOpacity: { value: 0.9 },
                            },
                        },
                    },
                ],
            },
            {
                type: 'group',
                name: 'markGroupPoint',
                from: {
                    facet: {
                        name: 'markGroupDataPoint',
                        data: 'dataProcessed',
                        groupby: 'secondaryType',
                    },
                },
                marks: [
                    {
                        type: 'symbol',
                        name: 'pointMark',
                        from: { data: 'markGroupDataPoint' },
                        encode: {
                            enter: {
                                fill: { scale: 'scale_colorForPoint', field: 'secondaryType' },
                                tooltip: {
                                    signal: createTooltip([
                                        'secondaryType',
                                        'secondaryAmount',
                                        'period',
                                    ]),
                                },
                            },
                            update: {
                                shape: { value: 'circle' },
                                x: {
                                    scale: 'scale_periodForBar',
                                    field: 'period',
                                    offset: { signal: 'bandwidth("scale_periodForBar") / 2' },
                                },
                                y: { scale: 'scale_amountForPoint', field: 'secondaryAmount' },
                                fillOpacity: {
                                    signal: '(datum.period === signal_currentHoverSymbol.period && datum.secondaryType === signal_currentHoverSymbol.secondaryType) ? 0.75 : 1',
                                },
                                size: {
                                    signal: '(datum.period === signal_currentHoverSymbol.period && datum.secondaryType === signal_currentHoverSymbol.secondaryType) ? 81 : 49',
                                },
                            },
                        },
                    },
                    {
                        type: 'rule',
                        from: { data: 'markGroupDataPoint' },
                        name: 'pointHorRule',
                        encode: {
                            enter: {
                                stroke: { scale: 'scale_colorForPoint', field: 'secondaryType' },
                                strokeWidth: { value: 1 },
                                strokeDash: { value: [6, 4] },
                            },
                            update: {
                                x: { signal: 'range("scale_periodForPoint")[1]' },
                                x2: { value: 0 },
                                y: { scale: 'scale_amountForPoint', field: 'secondaryAmount' },
                                y2: { scale: 'scale_amountForPoint', field: 'secondaryAmount' },
                                strokeOpacity: {
                                    signal: '(datum.period === signal_currentHoverSymbol.period && datum.secondaryType === signal_currentHoverSymbol.secondaryType) ? 0.75 : 0',
                                },
                            },
                        },
                    },
                ],
            },
            {
                type: 'rule',
                from: { data: 'dataProcessed' },
                name: 'pointHorRule',
                encode: {
                    enter: {
                        stroke: { scale: 'scale_colorForBar', field: 'type' },
                        strokeWidth: { value: 1 },
                        strokeDash: { value: [6, 2] },
                        zindex: { value: 100 },
                    },
                    update: {
                        x: { signal: 'width' },
                        x2: { signal: '0' },
                        y: { scale: 'scale_amountForBar', field: 'amount' },
                        y2: { scale: 'scale_amountForBar', field: 'amount' },
                        strokeOpacity: {
                            signal: '(datum.period === signal_currentHoverRect.period && datum.type === signal_currentHoverRect.type) ? 0.75 : 0',
                        },
                    },
                },
            },
        ],
        legends: [
            {
                ...defaultLegendSchema({
                    font, legend,
                    fill: 'scale_colorForBar',
                    customized: isCustomizeLegendLabel,
                }),
                labelLimit: 250,
            },
            {
                orient: 'bottom',
                symbolType: 'stroke',
                symbolSize: 100,
                titleFontSize: { value: 14 },
                labelFontSize: { value: 14 },
                direction: 'horizontal',
                offset: 20,
                title: legend,
                titleOrient: 'left',
                labelFont: font,
                titleFont: font,
                stroke: 'scale_colorForPoint',
                encode: {
                    symbols: {
                        name: 'legendSymbol',
                        interactive: true,
                    },
                    labels: {
                        name: 'legendLabel',
                        interactive: true,
                        update: {
                            text: {
                                signal: isCustomizedSecondaryLegendlabel
                                    ? 'scale("scale_legendForPoint", datum["value"])'
                                    : 'datum["value"]',
                            },
                            tooltip: { signal: isCustomizedSecondaryLegendlabel
                                ? 'scale("scale_legendForPoint", datum["value"])'
                                : 'datum["value"]' },
                        },
                    },
                },
            },
        ],
    };
};