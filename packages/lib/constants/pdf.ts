import { NEXT_PUBLIC_WEBAPP_URL } from './app';

export const DEFAULT_STANDARD_FONT_SIZE = 12;
export const DEFAULT_HANDWRITING_FONT_SIZE = 50;
export const DEFAULT_SIGNATURE_TEXT_FONT_SIZE = 18;

export const MIN_STANDARD_FONT_SIZE = 8;
export const MIN_HANDWRITING_FONT_SIZE = 20;

export const SIGNATURE_FONT_PATH = () => `${NEXT_PUBLIC_WEBAPP_URL()}/fonts/alex-brush-regular.ttf`;

/** @deprecated Use SIGNATURE_FONT_PATH instead */
export const CAVEAT_FONT_PATH = SIGNATURE_FONT_PATH;
