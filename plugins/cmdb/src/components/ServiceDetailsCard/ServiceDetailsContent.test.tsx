import { renderInTestApp } from '@backstage/test-utils';
import { ServiceDetailsContent } from './ServiceDetailsContent';
import { mockService, mockUser1, mockUser2 } from '../../mocks';

describe('<ServiceDetailsContent />', () => {
  it('should render', async () => {
    const component = await renderInTestApp(
      <ServiceDetailsContent
        details={mockService}
        owner={mockUser1}
        delegate={mockUser2}
      />,
    );
    expect(component).toBeDefined();
  });
  it('should display application name field', async () => {
    const { getByText } = await renderInTestApp(
      <ServiceDetailsContent details={mockService} />,
    );
    expect(getByText('Application Name').nodeName).toEqual('H2');
    expect(getByText(mockService.name).nodeName).toEqual('P');
  });
  it('should display application app code field', async () => {
    const { getByText } = await renderInTestApp(
      <ServiceDetailsContent details={mockService} />,
    );
    expect(getByText('App Code').nodeName).toEqual('H2');
    expect(getByText(mockService.u_application_id).nodeName).toEqual('SPAN');
    expect(
      getByText(mockService.u_application_id).classList.contains(
        'MuiChip-label',
      ),
    ).toBeTruthy();
  });
  it('should display application service criticality field', async () => {
    const { getByText } = await renderInTestApp(
      <ServiceDetailsContent details={mockService} />,
    );
    expect(getByText('Service Criticality').nodeName).toEqual('H2');
    expect(getByText(mockService.business_criticality).nodeName).toEqual('P');
  });
  it('should display application service owner field', async () => {
    const { getByText } = await renderInTestApp(
      <ServiceDetailsContent details={mockService} />,
    );
    expect(getByText('Service Owner').nodeName).toEqual('H2');
  });
  it('should display application service delegate field', async () => {
    const { getByText } = await renderInTestApp(
      <ServiceDetailsContent details={mockService} />,
    );
    expect(getByText('Service Owner').nodeName).toEqual('H2');
  });
  it('should display application support contact email field', async () => {
    const { getByText } = await renderInTestApp(
      <ServiceDetailsContent details={mockService} />,
    );
    expect(getByText('Support Contact Email').nodeName).toEqual('H2');
    expect(getByText(mockService.u_support_contact_email).nodeName).toEqual('P');
  });
});
