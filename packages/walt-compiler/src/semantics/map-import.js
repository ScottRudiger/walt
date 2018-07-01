// @flow
import curry from "curry";
import Syntax from "../Syntax";
import mapNode from "../utils/map-node";
import {
  FUNCTION_INDEX,
  TYPE_INDEX,
  TYPE_CONST,
  GLOBAL_INDEX,
} from "./metadata";

export const mapImport = curry((options, node, _) =>
  mapNode({
    [Syntax.BinaryExpression]: (as, transform) => {
      const [original, pair] = as.params;
      return transform({
        ...pair,
        params: [
          {
            ...pair.params[0],
            meta: {
              ...pair.params[0].meta,
              AS: original.value,
            },
          },
          ...pair.params.slice(1),
        ],
      });
    },
    [Syntax.Pair]: (pairNode, __) => {
      const { types, functions, globals } = options;
      const [identifierNode, typeNode] = pairNode.params;

      if (types[typeNode.value] != null) {
        // crate a new type

        const functionIndex = Object.keys(functions).length;
        const typeIndex = Object.keys(types).indexOf(typeNode.value);
        const functionNode = {
          ...identifierNode,
          id: identifierNode.value,
          type: types[typeNode.value].type,
          meta: {
            [FUNCTION_INDEX]: functionIndex,
            [TYPE_INDEX]: typeIndex,
            FUNCTION_METADATA: types[typeNode.value].meta.FUNCTION_METADATA,
            DEFAULT_ARGUMENTS: types[typeNode.value].meta.DEFAULT_ARGUMENTS,
          },
        };
        functions[identifierNode.value] = functionNode;
        return {
          ...pairNode,
          params: [functionNode, types[typeNode.value]],
        };
      }

      if (!["Table", "Memory"].includes(typeNode.type)) {
        const index = Object.keys(globals).length;

        globals[identifierNode.value] = {
          ...identifierNode,
          meta: { [GLOBAL_INDEX]: index, [TYPE_CONST]: true },
          type: typeNode.type,
        };
      }

      return pairNode;
    },
  })(node)
);
