import { renderInTestApp } from '@backstage/test-utils';
import { DetailsContent } from './DetailsContent';
import { mockEntityWithXeaixway } from '../../mocks';

describe('<DetailsContent />', () => {
  it('renders labels and values', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const x = (mockEntityWithXeaixway as any).metadata.xeaixway as {
      id: string;
      summary: string;
      phase: string;
      status: string;
      owner: string;
      tags: string[];
    };
    const { getByText } = await renderInTestApp(
      <DetailsContent
        summary={x.summary}
        id={x.id}
        phase={x.phase}
        status={x.status}
        tags={x.tags}
        ownerName={x.owner}
        namespace="default"
      />,
    );

    expect(getByText('Summary')).toBeInTheDocument();
    expect(getByText('Initiative')).toBeInTheDocument();
    expect(getByText('Phase')).toBeInTheDocument();
    expect(getByText('Status')).toBeInTheDocument();
    expect(getByText('Tags')).toBeInTheDocument();
    expect(getByText('Owner')).toBeInTheDocument();
    expect(getByText(x.summary)).toBeInTheDocument();
    expect(getByText(x.id)).toBeInTheDocument();
    expect(getByText(x.phase)).toBeInTheDocument();
    expect(getByText(x.status)).toBeInTheDocument();
    expect(getByText(x.tags[0])).toBeInTheDocument();
    expect(getByText(x.tags[1])).toBeInTheDocument();
  });
});
