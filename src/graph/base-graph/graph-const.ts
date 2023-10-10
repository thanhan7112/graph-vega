import { Axis, Legend, Title } from 'vega';

export const defaultFont = '"Roboto Condensed",Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';
export const defaultFontSize = 12;
export const defaultTitle: (font?: string) => Partial<Title> = (font = defaultFont) => ({
    anchor: 'start',
    frame: 'group',
    encode: {
        enter: {
            fontSize: { value: 45 },
            fill: { value: 'transparent' },
            fontWeight: { value: 'normal' },
            font: { value: font },
        },
        update: {
            y: { signal: '15', offset: -15 },
        },
    },
});

export const defaultAxis: (font?: string, fontSize?: number) => Partial<Axis> = (
    font = defaultFont,
    fontSize = defaultFontSize,
) => ({
    titleFontSize: 16,
    titleFontWeight: 500,
    grid: true,
    gridColor: '#efefef',
    offset: 5,
    titlePadding: 15,
    labelFont: font,
    labelFontSize: { signal: 'clamp(height / 18, 10, 14)' },
    labelSeparation: 5,
    titleFont: font,
});

export const defaultLegendSchema: (props: {
    fill?: string,
    font?: string,
    legend?: string
    customized?: boolean,
}) => Partial<Legend> = ({
    fill = 'bgColor',
    font = defaultFont,
    legend = 'Legend',
    customized = false,
}) => ({
    fill,
    orient: 'bottom',
    symbolType: 'square',
    symbolSize: 100,
    titleFontSize: { value: 14 },
    labelFontSize: { value: 14 },
    direction: 'horizontal',
    offset: 20,
    title: legend,
    titleOrient: 'left',
    labelFont: font,
    titleFont: font,
    encode: {
        symbols: {
            name: 'legendSymbol',
            interactive: true,
            enter: {
                fillOpacity: { value: 1 },
            },
        },
        labels: {
            name: 'legendLabel',
            interactive: true,
            update: {
                text: {
                    signal: customized
                        ? 'scale("legendLabelScale", datum["value"])'
                        : 'datum["value"]',
                },
                tooltip: { signal: customized
                    ? 'scale("legendLabelScale", datum["value"])'
                    : 'datum["value"]' },
            },
        },
    },
});

export const MapHelpText = {
    zoom: 'Hold Ctrl and scroll to Zoom',
};

export const GRAPH_CONFINED_CLASSNAME = 'base-graph-confined';