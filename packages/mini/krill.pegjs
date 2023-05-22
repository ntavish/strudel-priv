/*
krill.pegjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/krill.pegjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Some terminology:
// mini(notation) = a series of elements placed between quotes
// a stack = a series of vertically aligned slices sharing the same overall length
// a sequence = a series of horizontally aligned elements
// a choose = a series of elements, one of which is chosen at random


{
  var AtomStub = function(source)
  {
    this.type_ = "atom";
    this.source_ = source;
    this.location_ = location();
  }

  var PatternStub = function(source, alignment, seed)
  {
    this.type_ = "pattern";
    this.arguments_ = { alignment: alignment };
    if (seed !== undefined) {
      this.arguments_.seed = seed;
    }
    this.source_ = source;
  }

  var OperatorStub = function(name, args, source)
  {
    this.type_ = name;
    this.arguments_ = args;
    this.source_ = source;
  }

  var ElementStub = function(source, options)
  {
    this.type_ = "element";
    this.source_ = source;
    this.options_ = options;
    this.location_ = location();
  }

  var CommandStub = function(name, options)
  {
    this.type_ = "command";
    this.name_ = name;
    this.options_ = options;
  }

  var seed = 0;
}

start = statement

// ----- Numbers -----

number "number"
  = minus? int frac? exp? { return parseFloat(text()); }

decimal_point
  = "."

digit1_9
  = [1-9]

e
  = [eE]

exp
  = e (minus / plus)? DIGIT+

frac
  = decimal_point DIGIT+

int
  = zero / (digit1_9 DIGIT*)

minus
  = "-"

plus
  = "+"

zero
  = "0"

DIGIT  = [0-9]

// ------------------ delimiters ---------------------------

ws "whitespace" = [ \n\r\t]*
comma = ws "," ws
pipe = ws "|" ws
quote = '"' / "'"

// ------------------ steps and cycles ---------------------------

// single step definition (e.g bd)
step_char =  [0-9a-zA-Z~] / "-" / "#" / "." / "^" / "_"
step = ws chars:step_char+ ws { return new AtomStub(chars.join("")) }

// define a sub cycle e.g. [1 2, 3 [4]]
sub_cycle = ws  "[" ws s:stack_or_choose ws "]" ws { return s }

// define a polymeter e.g. {1 2, 3 4 5}
polymeter = ws  "{" ws s:polymeter_stack ws "}" stepsPerCycle:polymeter_steps? ws
  { s.arguments_.stepsPerCycle = stepsPerCycle ; return s; }

polymeter_steps = "%"a:slice
  { return a }

// define a step-per-cycle timeline e.g <1 3 [3 5]>. We simply defer to a sequence and
// change the alignment to slowcat
slow_sequence = ws "<" ws s:sequence ws ">" ws
  { s.arguments_.alignment = 'slowcat'; return s; }

// a slice is either a single step or a sub cycle
slice = step / sub_cycle / polymeter / slow_sequence

// slice modifier affects the timing/size of a slice (e.g. [a b c]@3)
// at this point, we assume we can represent them as regular sequence operators
slice_op = op_weight / op_bjorklund / op_slow / op_fast / op_replicate / op_degrade / op_tail

op_weight =  "@" a:number
  { return x => x.options_['weight'] = a }
  
op_replicate = "!"a:number
  { return x => x.options_['reps'] = a }

op_bjorklund = "(" ws p:slice_with_ops ws comma ws s:slice_with_ops ws comma? ws r:slice_with_ops? ws ")"
  { return x => x.options_['ops'].push({ type_: "bjorklund", arguments_ :{ pulse: p, step:s, rotation:r }}) }

op_slow = "/"a:slice
  { return x => x.options_['ops'].push({ type_: "stretch", arguments_ :{ amount:a, type: 'slow' }}) }

op_fast = "*"a:slice
  { return x => x.options_['ops'].push({ type_: "stretch", arguments_ :{ amount:a, type: 'fast' }}) }

op_degrade = "?"a:number?
  { return x => x.options_['ops'].push({ type_: "degradeBy", arguments_ :{ amount:a, seed: seed++ } }) }

op_tail = ":" s:slice
  { return x => x.options_['ops'].push({ type_: "tail", arguments_ :{ element:s } }) }

// a slice with an modifier applied i.e [bd@4 sd@3]@2 hh]
slice_with_ops = s:slice ops:slice_op*
  { const result = new ElementStub(s, {ops: [], weight: 1, reps: 1});
    for (const op of ops) {
      op(result);
    }
    return result;
  }

// a sequence is a combination of one or more successive slices (as an array)
sequence = s:(slice_with_ops)+
  { return new PatternStub(s, 'fastcat'); }

// a stack is a series of vertically aligned sequence, separated by a comma
stack_tail = tail:(comma @sequence)+
  { return { alignment: 'stack', list: tail }; }

// a choose is a series of pipe-separated sequence, one of which is
// chosen at random, each cycle
choose_tail = tail:(pipe @sequence)+
  { return { alignment: 'rand', list: tail, seed: seed++ }; }

// if the stack contains only one element, we don't create a stack but return the
// underlying element
stack_or_choose = head:sequence tail:(stack_tail / choose_tail)?
  { if (tail && tail.list.length > 0) { return new PatternStub([head, ...tail.list], tail.alignment, tail.seed); } else { return head; } }

polymeter_stack = head:sequence tail:stack_tail?
  { return new PatternStub(tail ? [head, ...tail.list] : [head], 'polymeter'); }


// Mini-notation innards ends
// ---------->8---------->8---------->8---------->8---------->8----------
// Experimental haskellish parser begins

// mini-notation = a quoted stack
mini = ws quote ws sc:stack_or_choose ws quote
  { return sc; }

// ------------------ operators ---------------------------

operator = scale / slow / fast / target / bjorklund / struct / rotR / rotL

struct = "struct" ws s:mini_or_operator
  { return { name: "struct", args: { mini:s }}}

target = "target" ws quote s:step quote
  { return { name: "target", args : { name:s}}}

bjorklund = "euclid" ws p:int ws s:int ws r:int?
  { return { name: "bjorklund", args :{ pulse: p, step:parseInt(s) }}}

slow = "slow" ws a:number
  { return { name: "stretch", args :{ amount: a}}}

rotL = "rotL" ws a:number
  { return { name: "shift", args :{ amount: "-"+a}}}

rotR = "rotR" ws a:number
  { return { name: "shift", args :{ amount: a}}}

fast = "fast" ws a:number
  { return { name: "stretch", args :{ amount: "1/"+a}}}

scale = "scale" ws quote s:(step_char)+ quote
{ return { name: "scale", args :{ scale: s.join("")}}}

comment = '//' p:([^\n]*)

// ---------------- grouping --------------------------------

group_operator = cat

// cat is another form of timeline
cat = "cat" ws "[" ws  s:mini_or_operator ss:(comma v:mini_or_operator { return v})* ws "]"
  { ss.unshift(s); return new PatternStub(ss, 'slowcat'); }

// ------------------ high level mini ---------------------------

mini_or_group =
  group_operator /
  mini

mini_or_operator =
  sg:mini_or_group ws (comment)*
    {return sg}
  / o:operator ws "$" ws soc:mini_or_operator
    { return new OperatorStub(o.name,o.args,soc)}

sequ_or_operator_or_comment =
  sc: mini_or_operator
    { return sc }
   / comment

mini_definition = s:sequ_or_operator_or_comment

// ---------------------- statements ----------------------------

command = ws c:(setcps / setbpm / hush) ws
  { return c }

setcps = "setcps" ws v:number
  { return new CommandStub("setcps", { value: v})}

setbpm = "setbpm" ws v:number
  { return new CommandStub("setcps", { value: (v/120/2)})}

hush = "hush"
  { return new CommandStub("hush")}

// ---------------------- statements ----------------------------

statement = mini_definition / command
