/** @public */
export type BusinessApplication = {
  sys_id: string;
  name: string;
  u_application_id: string;
  business_criticality: string;
  owned_by: {
    link: string;
    value: string;
  };
  u_delegate: {
    link: string;
    value: string;
  };
  u_support_contact_email: string;
};

/** @public */
export type ServiceNowUser = {
  user_name: string;
  name: string;
  email: string;
};

export type InfraDetails = {
  'parent.sys_class_name': string;
  'parent.name': string;
  u_display: string;
  'child.name': string;
  sys_updated_on: string;
};
