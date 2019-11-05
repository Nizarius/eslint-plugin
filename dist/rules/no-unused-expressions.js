"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const no_unused_expressions_1 = __importDefault(require("eslint/lib/rules/no-unused-expressions"));
const util = __importStar(require("../util"));
exports.default = util.createRule({
    name: 'no-unused-expressions',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow unused expressions',
            category: 'Best Practices',
            recommended: false,
        },
        schema: no_unused_expressions_1.default.meta.schema,
        messages: {
            expected: 'Expected an assignment or function call and instead saw an expression.',
        },
    },
    defaultOptions: [],
    create(context) {
        const config = context.options[0] || {}, allowShortCircuit = config.allowShortCircuit || false, allowTernary = config.allowTernary || false, allowTaggedTemplates = config.allowTaggedTemplates || false;
        /**
         * @param node - any node
         * @returns whether the given node structurally represents a directive
         */
        function looksLikeDirective(node) {
            return (node.type === 'ExpressionStatement' &&
                node.expression.type === 'Literal' &&
                typeof node.expression.value === 'string');
        }
        /**
         * @param predicate - ([a] -> Boolean) the function used to make the determination
         * @param list - the input list
         * @returns the leading sequence of members in the given list that pass the given predicate
         */
        function takeWhile(predicate, list) {
            for (let i = 0; i < list.length; ++i) {
                if (!predicate(list[i])) {
                    return list.slice(0, i);
                }
            }
            return list.slice();
        }
        /**
         * @param node - a Program or BlockStatement node
         * @returns the leading sequence of directive nodes in the given node's body
         */
        function directives(node) {
            return takeWhile(looksLikeDirective, node.body);
        }
        /**
         * @param node - any node
         * @param ancestors - the given node's ancestors
         * @returns whether the given node is considered a directive in its current position
         */
        function isDirective(node, ancestors) {
            const parent = ancestors[ancestors.length - 1], grandparent = ancestors[ancestors.length - 2];
            return ((parent.type === 'Program' ||
                (parent.type === 'BlockStatement' &&
                    grandparent.type.includes('Function'))) &&
                directives(parent).includes(node));
        }
        /**
         * Determines whether or not a given node is a valid expression. Recurses on short circuit eval and ternary nodes if enabled by flags.
         * @param node - any node
         * @returns whether the given node is a valid expression
         */
        function isValidExpression(node) {
            if (allowTernary) {
                // Recursive check for ternary and logical expressions
                if (node.type === 'ConditionalExpression') {
                    return (isValidExpression(node.consequent) &&
                        isValidExpression(node.alternate));
                }
            }
            if (allowShortCircuit) {
                if (node.type === 'LogicalExpression') {
                    return isValidExpression(node.right);
                }
            }
            if (allowTaggedTemplates && node.type === 'TaggedTemplateExpression') {
                return true;
            }
            return (/^(?:Assignment|(Optional)?Call|New|Update|Yield|Await)Expression$/u.test(node.type) ||
                (node.type === 'UnaryExpression' &&
                    ['delete', 'void'].includes(node.operator)));
        }
        return {
            ExpressionStatement(node) {
                if (!isValidExpression(node.expression) &&
                    !isDirective(node, context.getAncestors())) {
                    context.report({ node, messageId: 'expected' });
                }
            },
        };
    },
});
//# sourceMappingURL=no-unused-expressions.js.map