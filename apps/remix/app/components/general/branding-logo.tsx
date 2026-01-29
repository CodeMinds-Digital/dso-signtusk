import type { ImgHTMLAttributes } from "react";

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

export const BrandingLogo = ({ className, ...props }: LogoProps) => {
  return (
    <img src="/static/logo.svg" alt="Logo" className={className} {...props} />
  );
};
