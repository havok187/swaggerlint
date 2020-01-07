import Case from 'case';
import {Rule} from '../../types';
import {isRef} from '../../utils';

const name = 'object-prop-casing';

const validCasesSets = {
    camel: new Set(['camel', 'lower']), // someName
    snake: new Set(['snake', 'lower']), // some_name
    pascal: new Set(['pascal']), // SomeName
    constant: new Set(['constant']), // SOME_NAME
};

function isValidRuleOption(name: string): name is keyof typeof validCasesSets {
    return name in validCasesSets;
}

const rule: Rule = {
    name,
    visitor: {
        SchemaObject: ({node, report, setting}) => {
            if (typeof setting === 'boolean') return;

            const [settingCasingName] = setting;
            if (
                typeof settingCasingName === 'string' &&
                isValidRuleOption(settingCasingName)
            ) {
                const validCases = validCasesSets[settingCasingName];
                if (isRef(node)) return;
                if ('properties' in node && node.properties) {
                    Object.keys(node.properties).forEach(propName => {
                        const propCase = Case.of(propName);
                        if (!validCases.has(propCase)) {
                            const correctVersion =
                                settingCasingName in validCasesSets
                                    ? Case[settingCasingName](propName)
                                    : '';

                            report(
                                `Property "${propName}" has wrong casing.${
                                    correctVersion
                                        ? ` Should be "${correctVersion}".`
                                        : ''
                                }`,
                            );
                        }
                    });
                }
                return;
            }
        },
    },
    isValidSetting: option =>
        Array.isArray(option) && !!option[0] && option[0] in validCasesSets,
};

export default rule;
