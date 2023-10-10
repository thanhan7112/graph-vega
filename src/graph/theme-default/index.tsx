import defaultThemeJSON from './color.json';
import defaultGraphThemeJSON from './graph.json';
import { ColorSchemaKey } from './type';
import { createColorSchema } from './util';

const DefaultThemeValue = defaultThemeJSON;
const DefaultGraphColorSchema = defaultGraphThemeJSON;

export const DefaultColorSchema = createColorSchema<ColorSchemaKey>(DefaultThemeValue);
export { DefaultThemeValue };
export { DefaultGraphColorSchema };
export type {
    ColorSchemaKey,
} from './type';