import { Axis, Spec } from "vega";
import { GraphBuilder, SpecGenerator, SpeclessBaseGraph, defaultLang, getDefaultSize } from "../type";
import { GRAPH_CONFINED_CLASSNAME, defaultFont, defaultTitle } from "./graph-const";
import { clamp, mergeClass, mergeWithDefault } from "../util";
import { Suspense, lazy, useLayoutEffect, useRef } from "react";
import ReactResizeDetector from 'react-resize-detector';
import { HangingTitle } from "../hanging-title";
import { DefaultGraphColorSchema } from "../theme-default";
import { VisualizationSpec } from "react-vega";

export type SignalListener = (name: string, value: any) => void;
type DynamicSignalListener = { signalListener?: Record<string, SignalListener | undefined> };
type DynamicColorFieldMap = { dataScaleMap?: Record<string, string> };
type DynamicAxes = { axes?: Record<string, Partial<Axis>> };
type DynamicLang = { lang?: Partial<typeof defaultLang> };
export type BaseDynamicGraphProps = DynamicSignalListener
& DynamicColorFieldMap
& DynamicAxes
& DynamicLang;

const LazyVega = lazy(
    () =>
        new Promise<{ default: any }>((resolve, _) => {
            import('vega').then(mod => {
                /** Side Effect: Populate các theme màu default của đồ thị tại đây */
                Object
                    .values(DefaultGraphColorSchema)
                    .forEach(scheme => {
                        mod.scheme(scheme.name, scheme.scheme);
                    });
                /** End of Side Effect */

                import('react-vega').then(mod => {
                    const { Vega } = mod;

                    resolve({ default: Vega });
                });
            });
        }),
);

export type BaseGraph<
    T = Record<string, any>,
    DynamicGraphProps extends BaseDynamicGraphProps = BaseDynamicGraphProps,
> = SpeclessBaseGraph<T, DynamicGraphProps>
& {
    spec?: VisualizationSpec | SpecGenerator<T, DynamicGraphProps>,
};

export function BaseGraph<
    T extends Record<string, any>[],
    DynamicGraphProps extends BaseDynamicGraphProps = BaseDynamicGraphProps,
>({

    debug = false,
    name,
    data,
    spec,
    specTransform,
    containerSize,
    title,
    tool,
    error,
    lang,
    idling = false,
    loading = false,
    font = defaultFont,
    signalListener,
    fallback = <>NonPanel</>,
    // suspenseFallback = <Loading.FullView iconProps={{ loadingTitle: 'Generating...' }} />,
    suspenseFallback = <>Loading</>,
    confined = false,
    ...schemaProps
}: BaseGraph<T, DynamicGraphProps>) {
    const {
        height: fixedHeight,
        width: fixedWidth,
        minHeight,
        maxHeight,
        maxWidth,
        minWidth,
        heightByDataRatio,
        widthByDataRatio,
        maxConfinedHeight,
    } = mergeWithDefault(getDefaultSize(containerSize), containerSize);
    const normalizedTitle = typeof title === 'string'
        ? {
            text: '',
            ...defaultTitle(font),
        }
        : title;

    const onNewView = (view: any) => {
        if (debug) console.log(
            `GRAPH CONTEXT: ${name}`,
            view._runtime,
        );
    };

    const graphContainerRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        /** Side Effect: Graph dạng confined sẽ tự động update DashboardCell đang chứa nó một class đặc biệt để xóa padding */
        const directParentNode = graphContainerRef.current?.parentElement;
        if (directParentNode) {
            if (confined) {
                directParentNode.classList.add('js-dashboard-cell-no-padding');
            } else {
                directParentNode.classList.remove('js-dashboard-cell-no-padding');
            }
        }
        /** End of Side Effect */
    });

    return (
        <div ref={graphContainerRef}
            className={mergeClass(
                'base-graph',
                `graph-name-${name}`,
                confined ? GRAPH_CONFINED_CLASSNAME : '',
            )}
            style={{ fontFamily: font }}
        >
            <HangingTitle
                title={title}
                tool={tool}
            />
            <div className="base-graph-resize-detector">
                <ReactResizeDetector handleWidth={true} handleHeight={true}>
                    {({ width: autoWidth = 0, height: autoHeight = 0 }) => {
                        const normalizedMinWidth = minWidth(data, autoWidth, autoHeight);
                        const normalizedMaxHeight = maxHeight(data, autoWidth, autoHeight);
                        const normalizedMaxWidth = maxWidth(data, autoWidth, autoHeight);
                        const normalizedConfinedMaxHeight = typeof maxConfinedHeight === 'function'
                            ? Math.round(maxConfinedHeight(data, autoWidth, autoHeight))
                            : null;
                        const realHeight = fixedHeight(data, autoWidth, autoHeight);
                        const realWidth = fixedWidth(data, autoWidth, autoHeight);
                        /**
                         * Priority order:
                         * * Fixed Width: Hard-coded value
                         * * Derived from Height: Using ratio to derive width from current height
                         * * Derived from Data: Using ratio to calculate suitable width for current amount of data
                         * * Derived from Auto: Derive width from resize observer
                         */
                        const normalizedWidth = Math.round(clamp(
                            normalizedMinWidth,
                            realWidth === 'auto'
                                ? typeof widthByDataRatio !== 'number'
                                    ? autoWidth
                                    : data.length * widthByDataRatio
                                : realWidth,
                            normalizedMaxWidth,
                        ));
                        const basedMinHeight = minHeight(data, autoHeight, autoWidth);
                        const columnCount = Math.max(
                            1,
                            Math.floor(normalizedWidth / (schemaProps?.legendOption?.columnWidth ?? 150)),
                        );
                        const normalizedMinHeight = schemaProps.legendOption
                            ? basedMinHeight + Math.ceil(data.length / columnCount) * 20
                            : basedMinHeight;

                        /**
                         * Priority order:
                         * * Fixed Height: Hard-coded value
                         * * Derived from Data: Using ratio to calculate suitable height for current amount of data
                         * * Derived from Auto: Derive height from resize observer
                         */
                        const normalizedHeight = Math.round(clamp(
                            normalizedMinHeight,
                            realHeight === 'auto'
                                ? typeof heightByDataRatio !== 'number'
                                    ? autoHeight
                                    : data.length * heightByDataRatio
                                : realHeight,
                            normalizedMaxHeight,
                        ));

                        const normalizedSpec = typeof spec === 'function'
                            ? spec({
                                data,
                                size: {
                                    height: normalizedHeight,
                                    width: normalizedWidth,
                                },
                                lang,
                                normalizedTitle,
                                title: normalizedTitle,
                                font,
                                padding: confined,
                                ...schemaProps,
                            } as GraphBuilder<T, DynamicGraphProps>)
                            : spec;
                        const transformedSpec = specTransform
                            ? specTransform(normalizedSpec as Spec)
                            : normalizedSpec;

                        return <div className="graph-container"
                            style={{
                                width: realWidth === 'auto'
                                    ? '100%'
                                    : normalizedWidth,
                                minWidth: normalizedMinWidth,
                                maxWidth: normalizedMaxWidth,
                                height: realHeight === 'auto' && typeof heightByDataRatio !== 'number'
                                    ? '100%'
                                    : normalizedHeight,
                                minHeight: normalizedMinHeight,
                                maxHeight: normalizedConfinedMaxHeight
                                    ? normalizedConfinedMaxHeight
                                    : normalizedMaxHeight,
                            }}
                        >
                            {loading && <>Loading</>}
                            {(Object.keys(data).length === 0 && !idling && !error) && <div className="graph-no-data">
                                {fallback}
                            </div>}
                            <Suspense fallback={suspenseFallback}>
                                <LazyVega key="graph"
                                    className="graph-content"
                                    spec={transformedSpec}
                                    actions={false}
                                    width={normalizedWidth}
                                    height={normalizedHeight}
                                    signalListeners={signalListener}
                                    onNewView={onNewView}
                                />
                            </Suspense>
                            {(error) && <div className="graph-no-data error-panel">
                                {/* <AntResult 
                                    status='error'
                                    title={error.message}
                                    subtitle={error.description}
                                /> */}
                            </div>}
                        </div>;
                    }}
                </ReactResizeDetector>
            </div>
        </div>
    );
};

export default BaseGraph;