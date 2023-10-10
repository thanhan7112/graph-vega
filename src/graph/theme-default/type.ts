import defaultThemeJSON from './color.json';

const DefaultThemeValue = defaultThemeJSON;

export type ColorSchemaKey = keyof typeof DefaultThemeValue['main'];
