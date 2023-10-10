import React from 'react';
import './style.css'

export function mergeClass(...args: (string | undefined | null)[]) {
    return args.filter(Boolean).join(' ');
}

export type HangingTitle = {
    title?: React.ReactNode,
    tool?: React.ReactNode,
    className?: string,
};
export const HangingTitle = ({
    title,
    tool,
    className,
}: HangingTitle) => {
    return <div className={mergeClass('hanging-title truncate', className)}>
        <div className="hanging-title-value truncate">
            {title}
        </div>
        <div className="hanging-title-tool">
            {tool}
        </div>
    </div>;
};