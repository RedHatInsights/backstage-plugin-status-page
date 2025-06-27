import { Header, HeaderLabel } from '@backstage/core-components';

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
