import LogoDark from './logo/Logo_XE_compass_red_dark.svg';
import LogoLight from './logo/Logo_XE_compass_red_light.svg';
import Icon from './logo/Logo_XE_compass_icon.svg';

const logoVariants = {
  logoDark: {
    src: LogoDark,
    width: '160px',
  },
  logoLight: {
    src: LogoLight,
    width: '160px',
  },
  icon: {
    src: Icon,
    width: '35px',
  },
};

interface CompanyLogoProps {
  variant: keyof typeof logoVariants;
}

export const CompanyLogo = ({ variant }: CompanyLogoProps) => {
  const props = logoVariants[variant];

  return <img alt="company logo" {...props} />;
};
