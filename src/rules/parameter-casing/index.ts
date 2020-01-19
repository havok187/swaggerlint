import Case from 'case';
import {Rule, ParameterObject} from '../../types';
import {validCases, isValidCaseName, isObject} from '../../utils';

const name = 'parameter-casing';

function getCasesSetFromOptions(
    option: string | void,
    defaultCase: Set<string>,
): Set<string> {
    return isValidCaseName(option) ? validCases[option] : null ?? defaultCase;
}

const PARAMETER_LOCATIONS: ParameterObject['in'][] = [
    'query',
    'header',
    'path',
    'formData',
    'body',
];

const rule: Rule = {
    name,
    visitor: {
        ParameterObject: ({node, report, setting}) => {
            if (typeof setting === 'boolean') return;

            const [settingCasingName, opts = {}] = setting;
            if (
                typeof settingCasingName === 'string' &&
                isValidCaseName(settingCasingName)
            ) {
                const defaultParamCase = validCases[settingCasingName];
                const cases = {
                    query: getCasesSetFromOptions(opts.query, defaultParamCase),
                    header: getCasesSetFromOptions(
                        opts.header,
                        defaultParamCase,
                    ),
                    path: getCasesSetFromOptions(opts.path, defaultParamCase),
                    formData: getCasesSetFromOptions(
                        opts.formData,
                        defaultParamCase,
                    ),
                    body: getCasesSetFromOptions(opts.body, defaultParamCase),
                };

                const IGNORE_PARAMETER_NAMES = new Set<string>(
                    opts.ignore ?? [],
                );

                if (IGNORE_PARAMETER_NAMES.has(node.name)) return;

                const nodeCase = Case.of(node.name);
                if (!cases[node.in].has(nodeCase)) {
                    const correctVersion =
                        settingCasingName in validCases
                            ? Case[settingCasingName](node.name)
                            : '';

                    report(
                        `Parameter "${node.name}" has wrong casing.${
                            correctVersion
                                ? ` Should be "${correctVersion}".`
                                : ''
                        }`,
                    );
                }
            }
        },
    },
    isValidSetting: option => {
        if (typeof option !== 'object') return false;

        const [first, second] = option;
        const isValidFirstItem = first in validCases;
        if (!isValidFirstItem) {
            return {msg: `"${first}" is not a valid rule setting`};
        }
        if (option.length === 1) return true;

        if (isObject(second)) {
            if ('ignore' in second) {
                const ignore = second.ignore;
                if (!Array.isArray(ignore))
                    return {
                        msg: 'Setting contains "ignore" which is not an array.',
                    };

                const isEachIgnoreItemString = second.ignore.every(
                    (x: unknown) => typeof x === 'string',
                );
                if (!isEachIgnoreItemString) {
                    return {msg: 'Each item in "ignore" has to be a string.'};
                }
            }

            if (PARAMETER_LOCATIONS.some(name => !isValidCaseName(name))) {
                return {
                    msg:
                        'Settings for parameter location has to be a valid case name.',
                };
            }

            return true;
        } else return false;
    },
};

export default rule;
