// https://odbplusplus.com//wp-content/uploads/sites/2/2021/02/odb_spec_user.pdf
// XSIZE <size>
//      Horizontal size of a character.
// YSIZE <size>
//      Vertical size of a character.
// OFFSET <size>
//      Horizontal distance between the end of one character block and the
//      beginning of the next one.
// CHAR <char>
//      Defines the ASCII character defined by this block.
// LINE <xs> <ys> <xe> <ye> <pol> <shape> <width>
//      A character specification contains one or more LINE records, each
//      defining a line used to construct the character.
//      • (xs, ys) — Starting point of the line.
//      • (xe, ye) — Ending point of the line.
//      • pol — Polarity of the line (P for positive, N for negative).
//      • shape — The shape of the ends of the line (R for rounded, S for
//      square).
//      • width — Line width in mm or inches.
//      All coordinates are in mm or inches. Because fonts are scaled to a
//      specific text style, units in the font definition are irrelevant. Coordinates
//      and width can be expressed in any units.
// ECHAR
//      Ends the definition of a character.

// biome-ignore lint: unused now, but will be used in future when implementing character parsing
const characterSet = [
  "!",
  '"',
  "#",
  "$",
  "%",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ".",
  "/",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "[",
  "\\",
  "]",
  "^",
  "_",
  "`",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "{",
  "|",
  "}",
  "~",
  "",
  "",
]
