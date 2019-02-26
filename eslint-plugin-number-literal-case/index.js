"use strict";

const fix = value => {
  if (!/^0[a-zA-Z]/.test(value)) {
    return value;
  }

  const indicator = value[1].toLowerCase();
  const val = value.slice(2).toUpperCase();

  return `0${indicator}${val}`;
};

const create = context => {
  return {
    Literal: node => {
      const value = node.raw;
      const fixedValue = fix(value);
      console.log(`${value} - ${fixedValue}`);

      if (value !== fixedValue) {
        context.report({
          node,
          message: "Invalid number literal casing.",
          fix: fixer => fixer.replaceText(node, fixedValue)
        });
      }
    }
  };
};

module.exports = {
  rules: {
    "number-literal-case": {
      create,
      meta: {
        description:
          "Enforce lowercase identifier and uppercase value for number literals",
        type: "suggestion",
        docs: "no docs",
        fixable: "code"
      }
    }
  }
};
