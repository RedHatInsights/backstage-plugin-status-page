import {
  createComponentExtension,
  createPlugin,
} from '@backstage/core-plugin-api';

export const contactDetailsPlugin = createPlugin({
  id: 'contact-details',
});

/** @public */
export const ContactDetailsCard = contactDetailsPlugin.provide(
  createComponentExtension({
    name: 'ContactDetailsCard',
    component: {
      lazy: () =>
        import('./components/ContactDetailsCard').then(
          m => m.ContactDetailsCard,
        ),
    },
  }),
);
