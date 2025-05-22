import { Header, HeaderLabel } from '@backstage/core-components';
import React from 'react';

interface PageWithHeaderProps {
    title: string;
    subtitle: string;
}

export const StatusPageHeader = ({ title, subtitle }: PageWithHeaderProps) => {
    return (
        <>
            <Header title={title} subtitle={subtitle}>
                <HeaderLabel label="Owner" value="AppDev" />
                <HeaderLabel label="Lifecycle" value="Alpha" />
            </Header>
        </>
    );
};
