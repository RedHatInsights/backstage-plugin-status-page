import { FC, ReactNode } from 'react';
import { Box, Typography } from '@material-ui/core';
import { Progress } from '@backstage/core-components';

export interface LoadingWrapperProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'inline' | 'overlay' | 'fullscreen';
}

/**
 * Reusable loading wrapper component for consistent loading UI across the GDPR plugin
 */
export const LoadingWrapper: FC<LoadingWrapperProps> = ({
  isLoading,
  loadingText = 'Loading...',
  children,
  size = 'medium',
  variant = 'inline',
}) => {
  const getProgressSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16 };
      case 'large':
        return { width: 48, height: 48 };
      case 'medium':
      default:
        return { width: 24, height: 24 };
    }
  };

  const renderLoadingContent = () => (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      p={variant === 'fullscreen' ? 8 : 2}
    >
      <Progress style={getProgressSize()} />
      <Box ml={2}>
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'} 
          color="textSecondary"
        >
          {loadingText}
        </Typography>
      </Box>
    </Box>
  );

  if (!isLoading) {
    return <>{children}</>;
  }

  switch (variant) {
    case 'overlay':
      return (
        <Box position="relative">
          <Box style={{ opacity: 0.5 }}>
            {children}
          </Box>
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="rgba(255, 255, 255, 0.8)"
            zIndex={1}
          >
            {renderLoadingContent()}
          </Box>
        </Box>
      );

    case 'fullscreen':
      return (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.9)"
          zIndex={9999}
        >
          {renderLoadingContent()}
        </Box>
      );

    case 'inline':
    default:
      return renderLoadingContent();
  }
};
