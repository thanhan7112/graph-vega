import { ColorSchema } from "../model";

export const createColorSchema = <ColorSchemaKey extends string>(
    schema: Record<'main' | 'sub' | 'contrast', Record<string, string>>,
) => {
    const ColorSchemaMap: Record<string, ColorSchema> = {};
    const vendorClass = ['primary', 'secondary', 'tertiary'];

    Object
        .keys(schema.main)
        .forEach(setName => {
            /**
             * Chuyển hoá class name từ key, vì vendor name dễ bị trùng class (các từ khoá "primary", "secondary" dễ bị override vô ý), nên tạm thời ta phải chia trường hợp đặc biệt cho riêng chúng.
             */
            const className = vendorClass.includes(setName)
                ? `${setName}-theme`
                : setName
                    .split(/(?=[A-Z])/)
                    .map(entry => entry.toLowerCase())
                    .join('-');

            ColorSchemaMap[setName] = {
                name: setName,
                setClass: className,
                main: `var(--main-${setName})`,
                mainExplicit: schema.main[setName],
                sub: `var(--sub-${setName})`,
                subExplicit: schema.sub[setName],
                contrast: `var(--contrast-${setName})`,
                contrastExplicit: schema.contrast[setName],
            };
        });

    return ColorSchemaMap as Record<ColorSchemaKey, ColorSchema>;
};