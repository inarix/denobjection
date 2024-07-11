import { nany } from '../../ninja.ts';

export type Node = {
  [key: string]: nany;
  $name: string;
  $relation: string;
  $modify: string[];
  $recursive: boolean | number;
  $allRecursive: boolean;
  $childNames: string[];
};

function nodeFactory(): Node {
  return {
    $name: '',
    $relation: '',
    $modify: [],
    $recursive: false,
    $allRecursive: false,
    $childNames: [],
  };
}

export function parseRelExpr(expr: string): Node {
  const node = nodeFactory();

  const match = expr.match(/[a-zA-Z0-9* ]+/);
  if (!match) {
    return node;
  }

  node.$name = node.$relation = match[0];

  if (node.$name == '*') {
    node.$allRecursive = true;
  }

  const aliasMatch = node.$name.match(/([a-zA-Z0-9]+) as ([a-zA-Z0-9]+)/);
  if (aliasMatch) {
    node.$relation = aliasMatch[1];
    node.$name = aliasMatch[2];
  }

  const modifyMatch = expr.match(
    new RegExp(`${node.$name}\\(([a-zA-Z0-9, ]+)\\)`),
  );
  node.$modify =
    modifyMatch?.[1]?.split(',').map((modifier) => modifier.trim()) || [];

  let charAt = (match.index || 0) + match[0].length;

  return node;
}

function peg$subclass(child, parent) {
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message = message;
  this.expected = expected;
  this.found = found;
  this.location = location;
  this.name = 'SyntaxError';

  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function (expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function (expectation) {
      return '"' + literalEscape(expectation.text) + '"';
    },

    class: function (expectation) {
      var escapedParts = '',
        i;

      for (i = 0; i < expectation.parts.length; i++) {
        escapedParts += expectation.parts[i] instanceof Array
          ? classEscape(expectation.parts[i][0]) + '-' +
            classEscape(expectation.parts[i][1])
          : classEscape(expectation.parts[i]);
      }

      return '[' + (expectation.inverted ? '^' : '') + escapedParts + ']';
    },

    any: function (expectation) {
      return 'any character';
    },

    end: function (expectation) {
      return 'end of input';
    },

    other: function (expectation) {
      return expectation.description;
    },
  };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g, function (ch) {
        return '\\x0' + hex(ch);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) {
        return '\\x' + hex(ch);
      });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g, '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g, function (ch) {
        return '\\x0' + hex(ch);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) {
        return '\\x' + hex(ch);
      });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
      i,
      j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + ' or ' + descriptions[1];

      default:
        return (
          descriptions.slice(0, -1).join(', ') + ', or ' +
          descriptions[descriptions.length - 1]
        );
    }
  }

  function describeFound(found) {
    return found ? '"' + literalEscape(found) + '"' : 'end of input';
  }

  return 'Expected ' + describeExpected(expected) + ' but ' +
    describeFound(found) + ' found.';
};

function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},
    peg$startRuleFunctions = { start: peg$parsestart },
    peg$startRuleFunction = peg$parsestart,
    peg$c0 = function (expr) {
      const node = newNode();

      if (expr.$name === '*') {
        node.$allRecursive = true;
      } else {
        assertDuplicateRelation(node, expr);
        node[expr.$name] = expr;
        node.$childNames.push(expr.$name);
      }

      return node;
    },
    peg$c1 = function (list) {
      const node = newNode();

      list.forEach((expr) => {
        assertDuplicateRelation(node, expr);
        node[expr.$name] = expr;
        node.$childNames.push(expr.$name);
      });

      return node;
    },
    peg$c2 = function (name, args, alias, list) {
      const node = newNode();

      node.$name = alias || name;
      node.$relation = name;
      node.$modify = args || [];

      list.forEach((expr) => {
        assertDuplicateRelation(node, expr);
        node[expr.$name] = expr;
        node.$childNames.push(expr.$name);
      });

      return node;
    },
    peg$c3 = function (name, args, alias, expr) {
      const node = newNode();

      node.$name = alias || name;
      node.$relation = name;
      node.$modify = args || [];

      if (expr) {
        const match = /^\^(\d*)$/.exec(expr.$name);

        if (match) {
          if (match[1]) {
            node.$recursive = parseInt(match[1], 10);
          } else {
            node.$recursive = true;
          }
        } else if (expr.$name === '*') {
          node.$allRecursive = true;
        } else {
          assertDuplicateRelation(node, expr);
          node[expr.$name] = expr;
          node.$childNames.push(expr.$name);
        }
      }

      return node;
    },
    peg$c4 = 'as',
    peg$c5 = peg$literalExpectation('as', false),
    peg$c6 = function (alias) {
      return alias;
    },
    peg$c7 = function (name) {
      return name.join('');
    },
    peg$c8 = /^[^[\](),. \t\r\n]/,
    peg$c9 = peg$classExpectation(
      ['[', ']', '(', ')', ',', '.', ' ', '\t', '\r', '\n'],
      true,
      false,
    ),
    peg$c10 = '(',
    peg$c11 = peg$literalExpectation('(', false),
    peg$c12 = ')',
    peg$c13 = peg$literalExpectation(')', false),
    peg$c14 = function (args) {
      return args;
    },
    peg$c15 = ',',
    peg$c16 = peg$literalExpectation(',', false),
    peg$c17 = function (arg) {
      return arg;
    },
    peg$c18 = /^[ \t\r\n]/,
    peg$c19 = peg$classExpectation([' ', '\t', '\r', '\n'], false, false),
    peg$c20 = '.',
    peg$c21 = peg$literalExpectation('.', false),
    peg$c22 = function (list) {
      return list;
    },
    peg$c23 = '[',
    peg$c24 = peg$literalExpectation('[', false),
    peg$c25 = ']',
    peg$c26 = peg$literalExpectation(']', false),
    peg$c27 = function (items) {
      return items;
    },
    peg$c28 = function (expr) {
      return expr;
    },
    peg$c29 = function (sub) {
      return sub;
    },
    peg$currPos = 0,
    peg$savedPos = 0,
    peg$posDetailsCache = [{ line: 1, column: 1 }],
    peg$maxFailPos = 0,
    peg$maxFailExpected = [],
    peg$silentFails = 0,
    peg$result;

  if ('startRule' in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error(
        'Can\'t start parsing from rule "' + options.startRule + '".',
      );
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== void 0
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location,
    );
  }

  function error(message, location) {
    location = location !== void 0
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: 'literal', text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return {
      type: 'class',
      parts: parts,
      inverted: inverted,
      ignoreCase: ignoreCase,
    };
  }

  function peg$anyExpectation() {
    return { type: 'any' };
  }

  function peg$endExpectation() {
    return { type: 'end' };
  }

  function peg$otherExpectation(description) {
    return { type: 'other', description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos],
      p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column,
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos),
      endPosDetails = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column,
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column,
      },
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location,
    );
  }

  function peg$parsestart() {
    var s0, s1;

    s0 = peg$currPos;
    s1 = peg$parseexpression();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c0(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parselistExpression();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c1(s1);
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parseexpression() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    s1 = peg$parsename();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseargs();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsealias();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesubListExpression();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c2(s1, s2, s3, s4);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseargs();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsealias();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesubExpression();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c3(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parsealias() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsews();
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsews();
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c4) {
        s2 = peg$c4;
        peg$currPos += 2;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c5);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parsews();
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsews();
          }
        } else {
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parsename();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c6(s4);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsename() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsechar();
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsechar();
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c7(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parsechar() {
    var s0;

    if (peg$c8.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c9);
      }
    }

    return s0;
  }

  function peg$parseargs() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsews();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parsews();
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 40) {
        s2 = peg$c10;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c11);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parseargListItem();
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parseargListItem();
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parsews();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parsews();
          }
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c12;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c13);
              }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c14(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseargListItem() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsews();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parsews();
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsename();
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parsews();
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parsews();
        }
        if (s3 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c15;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c16);
            }
          }
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c17(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsews() {
    var s0;

    if (peg$c18.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c19);
      }
    }

    return s0;
  }

  function peg$parsesubListExpression() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsews();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parsews();
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 46) {
        s2 = peg$c20;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c21);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parselistExpression();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c22(s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parselistExpression() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsews();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parsews();
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 91) {
        s2 = peg$c23;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c24);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parselistExpressionItem();
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parselistExpressionItem();
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parsews();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parsews();
          }
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s5 = peg$c25;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c26);
              }
            }
            if (s5 !== peg$FAILED) {
              s6 = [];
              s7 = peg$parsews();
              while (s7 !== peg$FAILED) {
                s6.push(s7);
                s7 = peg$parsews();
              }
              if (s6 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c27(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parselistExpressionItem() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsews();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parsews();
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseexpression();
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parsews();
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parsews();
        }
        if (s3 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c15;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c16);
            }
          }
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c28(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsesubExpression() {
    var s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsews();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parsews();
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 46) {
        s2 = peg$c20;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c21);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parsews();
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parsews();
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseexpression();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parsews();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parsews();
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c29(s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function assertDuplicateRelation(node, expr) {
    if (expr.$name in node) {
      console.warn(
        `Duplicate relation "${expr.$name}" in a relation expression. You should use "a.[b, c]" instead of "[a.b, a.c]". This will cause an error in objection 2.0`,
      );

      // TODO: enable for v2.0.
      // const err = new Error();
      // err.duplicateRelationName = expr.$name;
      // throw err;
    }
  }

  function newNode() {
    return {
      $name: null,
      $relation: null,
      $modify: [],
      $recursive: false,
      $allRecursive: false,
      $childNames: [],
    };
  }

  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos),
    );
  }
}

// module.exports = {
//   SyntaxError: peg$SyntaxError,
//   parse: peg$parse,
// };
