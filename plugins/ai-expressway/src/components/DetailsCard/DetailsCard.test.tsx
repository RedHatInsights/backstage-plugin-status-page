import { renderInTestApp } from '@backstage/test-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { DetailsCard } from './DetailsCard';
import { mockEntityWithXeaixway, mockEntityWithoutXeaixway } from '../../mocks';

describe('<DetailsCard>', () => {
  const renderWithEntity = (entity: any) =>
    renderInTestApp(
      <EntityProvider entity={entity}>
        <DetailsCard />
      </EntityProvider>,
    );

  it('renders EmptyState when xeaixway metadata is missing', async () => {
    const { getByText } = await renderWithEntity(mockEntityWithoutXeaixway);
    expect(getByText('XE AI Expressway data not found')).toBeInTheDocument();
  });

  it('renders XE AI Expressway details from metadata.xeaixway', async () => {
    const { getByText } = await renderWithEntity(mockEntityWithXeaixway);
    expect(getByText('XE AI Expressway')).toBeInTheDocument();
    expect(getByText('Summary')).toBeInTheDocument();
    expect(getByText('Initiative')).toBeInTheDocument();
    expect(getByText('Phase')).toBeInTheDocument();
    expect(getByText('Status')).toBeInTheDocument();
    expect(getByText('Tags')).toBeInTheDocument();
    expect(getByText('Owner')).toBeInTheDocument();

    expect(getByText('Test summary')).toBeInTheDocument();
    expect(getByText('XEAIXWAY-95')).toBeInTheDocument();
    expect(getByText('ALPHA')).toBeInTheDocument();
    expect(getByText('In Progress')).toBeInTheDocument();
    expect(getByText('Owner Person')).toBeInTheDocument();
    expect(getByText('t1')).toBeInTheDocument();
    expect(getByText('t2')).toBeInTheDocument();
  });
});


