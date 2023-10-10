import BaseGraph from "../base-graph";
import { createUncontrolledGraph } from "../graph-controller";
import { SpeclessBaseGraph } from "../type";
import { BarLineChartSchema, BarLineChartSpecificProps } from "./default";
import { BarLineChartData } from "./model";

const createUncontrolledBarLineGraph = (BaseGraph: (props: BaseBarLineGraph) => JSX.Element) => {
    return createUncontrolledGraph<BarLineChartData, BarLineChartSpecificProps>(BaseGraph);
};

export type BaseBarLineGraph = SpeclessBaseGraph<BarLineChartData[], BarLineChartSpecificProps>;
export const BaseBarLineGraph = (props: BaseBarLineGraph) => {
    return <BaseGraph<BarLineChartData[], BarLineChartSpecificProps>
        {...props}
        spec={BarLineChartSchema}
    />;
};
export const BarLineGraph = createUncontrolledBarLineGraph(BaseBarLineGraph);