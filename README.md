# lineagejs

A simple layer over ES3 / ES5 style prototypes that makes `super` calls *easy* and yet *private*
(no `this._super` field on the prototype).

```javascript
function SuperClass() {}
SuperClass.prototype.someMethod = function SuperClass$someMethod() {
  console.log("SuperClass.someMethod called");
};

// or
var SuperClass = Lineage.define(function SuperClass$namespace(self) {
  self.someMethod = function SuperClass$someMethod() {
    console.log("SuperClass.someMethod called");
  };
});

var SubClass = Lineage.define(SuperClass, function Subclass$namespace(self, $super) {
  // self is your newly created prototype
  // and $super is a reference to *SuperClass*'s prototype.
  self.someMethod = function Subclass$someMethod() {
    return $super.someMethod.call(this);
    console.log("Subclass.someMethod called");
  };
});

var test = new SubClass();
test.someMethod();
// SuperClass.someMethod called
// SubClass.someMethod called
test.$super // undefined
```

Created by [TJ Crowder](https://github.com/tjcrowder) - forked from Google Code to preserve it.

Licenced under [CC By-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/).
