import { BusinessApplication } from '../apis';

export const mockService: BusinessApplication = {
  sys_id: '',
  name: 'Test Application',
  u_application_id: 'APP-001',
  business_criticality: 'C1',
  owned_by: {
    link: '#',
    value: 'testuuid',
  },
  u_delegate: {
    link: '#',
    value: 'testuuid2',
  },
  u_support_contact_email: 'mail@example.com',
};
