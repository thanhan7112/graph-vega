import React, { useMemo, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { BaseBarLineGraph } from './graph/bar-line-graph';

function App() {
  
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState([
    {
        period: '20231120',
        period_time: 1,
        amount: 1,
        secondaryAmount: 1,
        type: 'Number of items delivered on-site',
        secondaryType: 'Value of items delivered',
    },
    {
        period: '20231121',
        period_time: 2,
        amount: 2,
        secondaryAmount: 2,
        type: 'Number of items delivered on-site',
        secondaryType: 'Value of items delivered',
    },
    {
        period: '20231122',
        period_time: 3,
        amount: 3,
        secondaryAmount: 3,
        type: 'Number of items delivered on-site',
        secondaryType: 'Value of items delivered',
    },
    {
        period: '20231123',
        period_time: 1,
        amount: 1,
        secondaryAmount: 1,
        type: 'Number of items delivered on-site',
        secondaryType: 'Value of items delivered',
    }
])

  const graphProps = useMemo((): React.ComponentProps<typeof BaseBarLineGraph> => {
    return {
        title: 'Items Delivered in the last 12 months',
        name: 'item-delivered-statistic',
        data: (data ?? []).map(({ period, amount, secondaryAmount, secondaryType, type }) => {
            return {
                period: period ?? '',
                // period_time:   period_time,
                amount: amount,
                secondaryAmount: secondaryAmount,
                type: type,
                secondaryType: secondaryType,
            };
        }),
        containerSize: {
            width: () => 'auto' as any,
            height: () => 380,
            minWidth: () => 400,
            maxWidth: () => 2000,
        },
        lang: {
            xAxisName: 'Time Period',
            yAxisName: 'Number of Delivered Items',
            y2AxisName: 'Value of Delivered Items ($)',
        },
        tooltipValue: {
            secondaryAmount: 'datum["amount"] < 0 ? "-$" + format(datum["amount"] * -1, ",") : "$" + format(datum["amount"], ",")',
            period: 'timeFormat(datum["period"], "%b, %Y")',
        },
        tooltipLabel: {
            period: 'In',
        },
        axes: {
            xAxis: {
                format: '%b %Y',
            },
        },
        font: '"Roboto Condensed", sans-serif',
        loading: isLoading,
        signalListener: undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [data, isLoading]);

  return (
    <BaseBarLineGraph {...graphProps} />
  );
}

export default App;
