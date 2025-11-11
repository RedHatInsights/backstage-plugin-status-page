import { SxProps, Theme } from "@mui/material/styles";
import { GlobalHeaderComponentMountPointConfig } from "@red-hat-developer-hub/backstage-plugin-global-header";
import { ComponentType, ComponentProps } from "react";

export interface GlobalHeaderComponentMountPoint<
  T extends ComponentType<any> = ComponentType<any>
> {
  Component: T;
  config?: GlobalHeaderComponentMountPointConfig & {
    props?: Partial<ComponentProps<T>>;
    layout?: SxProps<Theme>;
  };
}
