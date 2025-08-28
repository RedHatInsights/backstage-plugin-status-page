import { renderInTestApp } from '@backstage/test-utils';
import { DetailsField } from './DetailsField';

describe('<DetailsField />', () => {
  it('renders label and value', async () => {
    const { getByText } = await renderInTestApp(
      <DetailsField label="Test Label" value="Test Value" />
    );
    expect(getByText('Test Label')).toBeInTheDocument();
    expect(getByText('Test Value')).toBeInTheDocument();
  });

  it('renders not specified when no value provided', async () => {
    const { getByText } = await renderInTestApp(
      <DetailsField label="Test Label" />
    );
    expect(getByText('Test Label')).toBeInTheDocument();
    expect(getByText('Not specified')).toBeInTheDocument();
  });

  it('renders children when provided', async () => {
    const { getByText } = await renderInTestApp(
      <DetailsField label="Test Label">
        <span>Custom Content</span>
      </DetailsField>
    );
    expect(getByText('Test Label')).toBeInTheDocument();
    expect(getByText('Custom Content')).toBeInTheDocument();
  });
});

