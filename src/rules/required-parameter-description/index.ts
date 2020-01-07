import {Rule} from '../../types';

const name = 'required-parameter-description';

const rule: Rule = {
    name,
    visitor: {
        ParameterObject: ({node, report}) => {
            if (!('description' in node) || !node.description) {
                report(`"${node.name}" parameter is missing description.`);
            }
        },
    },
};

export default rule;
