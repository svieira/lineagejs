Lineage is a small, simple toolkit for creating JavaScript constructor functions and their prototypes in a straight-forward and concise way. Key points:

  * Lineage's API lets you define prototypes with a very concise syntax, while still encouraging you to create functions with real names (rather than anonymous functions); this helps your tools help you (debuggers show function names in call stacks, for example).

  * Lineage provides a _highly efficient_ mechanism for "supercalls" (calling into the parent prototype's versions of methods from an instance using a derived prototype).

  * Lineage's API encourages and supports use of the module pattern for each constructor and its prototype.

  * Lineage is small, <3k compressed (gzips to <1,500 bytes, a quarter of which is the MIT license) -- because it doesn't try to reinvent inheritance, it just simplifies access to the power of JavaScript's own prototypical inheritance.